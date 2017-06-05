"use strict";
import bodec from 'bodec';
import inflate from '../lib/inflate';
import deflate from '../lib/deflate';
import * as codec from '../lib/object-codec';
import {parseEntry as parsePackEntry} from '../lib/pack-codec';
import applyDelta from '../lib/apply-delta';
import sha1 from 'git-sha1';
import {join as pathJoin} from 'path';

// The fs object has the following interface:
// - readFile(path) => binary
//   Must also call callback() with no arguments if the file does not exist.
// - readChunk(path, start, end) => binary
//   Must also call callback() with no arguments if the file does not exist.
// - writeFile(path, binary) =>
//   Must also make every directory up to parent of path.
// - readDir(path) => array<paths>
//   Must also call callback() with no arguments if the file does not exist.
// The repo is expected to have a rootPath property that points to
// the .git folder within the filesystem.
export default function (repo, fs) {

  const cachedIndexes = {};

  repo.loadAs = loadAs;
  repo.saveAs = saveAs;
  repo.loadRaw = loadRaw;
  repo.saveRaw = saveRaw;
  repo.readRef = readRef;
  repo.updateRef = updateRef;
  repo.hasHash = hasHash;
  repo.init = init;
  repo.setShallow = setShallow;

  async function init(ref) {
    ref = ref || "refs/heads/master";
    const path = pathJoin(repo.rootPath, "HEAD");
    return await fs.writeFile(path, "ref: " + ref);
  }

  async function setShallow(ref) {
    const path = pathJoin(repo.rootPath, "shallow");
    return await fs.writeFile(path, ref);
  }

  async function updateRef(ref, hash) {
    const path = pathJoin(repo.rootPath, ref);
    const lock = path + ".lock";
    await fs.writeFile(lock, bodec.fromRaw(hash + "\n"));
    return await fs.rename(lock, path);
  }

  async function readRef(ref) {
    const path = pathJoin(repo.rootPath, ref);
    const binary = await fs.readFile(path);
    if (binary === undefined) {
      return readPackedRef(ref);
    }
    return bodec.toRaw(binary).trim();
  }

  async function readPackedRef(ref) {
    const path = pathJoin(repo.rootPath, "packed-refs");
    const binary = await fs.readFile(path);
    const text = bodec.toRaw(binary);
    const index = text.indexOf(ref);
    if (index >= 0) {
      return text.substring(index - 41, index - 1);
    }
  }

  async function saveAs(type, body) {
    const raw = codec.frame({
      type: type,
      body: codec.encoders[type](body)
    });
    const hash = sha1(raw);
    await saveRaw(hash, raw);
    return hash;
  }

  async function saveRaw(hash, raw) {
    if (sha1(raw) !== hash) {
      throw new Error("Save data does not match hash");
    }
    const buffer = deflate(raw);
    const path = hashToPath(hash);
    // Try to read the object first.
    const data = await loadRaw(hash);
    // If it already exists, we're done
    if (data) return;
    // Otherwise write a new file
    const tmp = path.replace(/[0-9a-f]+$/, 'tmp_obj_' + Math.random().toString(36).substr(2));
    await fs.writeFile(tmp, buffer);
    return await fs.rename(tmp, path);
  }

  function loadAs(type, hash, callback) {
    if (!callback) return loadAs.bind(repo, type, hash);
    loadRaw(hash, (err, raw) => {
      if (raw === undefined) return callback(err);
      let body;
      try {
        raw = codec.deframe(raw);
        if (raw.type !== type) throw new TypeError("Type mismatch");
        body = codec.decoders[raw.type](raw.body);
      }
      catch (err) { return callback(err); }
      callback(null, body);
    });
  }

  function hasHash(hash, callback) {
    if (!callback) return hasHash.bind(repo, hash);
    loadRaw(hash, (err, body) => {
      if (err) return callback(err);
      return callback(null, !!body);
    });
  }

  function loadRaw(hash, callback) {
    if (!callback) return loadRaw.bind(repo, hash);
    const path = hashToPath(hash);
    fs.readFile(path, (err, buffer) => {
      if (err) return callback(err);
      if (buffer) {
        let raw;
        try { raw = inflate(buffer); }
        catch (err) { return callback(err); }
        return callback(null, raw);
      }
      return loadRawPacked(hash, callback);
    });
  }

  function loadRawPacked(hash, callback) {
    const packDir = pathJoin(repo.rootPath, "objects/pack");
    const packHashes = [];
    fs.readDir(packDir, (err, entries) => {
      if (!entries) return callback(err);
      entries.forEach(name => {
        const match = name.match(/pack-([0-9a-f]{40}).idx/);
        if (match) packHashes.push(match[1]);
      });
      start();
    });

    function start() {
      const packHash = packHashes.pop();
      let offsets;
      if (!packHash) return callback();
      if (!cachedIndexes[packHash]) loadIndex(packHash);
      else onIndex();

      function loadIndex(packHash) {
        const indexFile = pathJoin(packDir, "pack-" + packHash + ".idx" );
        fs.readFile(indexFile, (err, buffer) => {
          if (!buffer) return callback(err);
          try {
            cachedIndexes[packHash] = parseIndex(buffer);
          }
          catch (err) { return callback(err); }
          onIndex();
        });
      }

      function onIndex() {
        const cached = cachedIndexes[packHash];
        const packFile = pathJoin(packDir, "pack-" + packHash + ".pack" );
        const index = cached.byHash[hash];
        if (!index) return start();
        offsets = cached.offsets;
        loadChunk(packFile, index.offset, callback);
      }

      function loadChunk(packFile, start, callback) {
        const index = offsets.indexOf(start);
        if (index < 0) {
          const error = new Error("Can't find chunk starting at " + start);
          return callback(error);
        }
        const end = index + 1 < offsets.length ? offsets[index + 1] : -20;
        fs.readChunk(packFile, start, end, (err, chunk) => {
          if (!chunk) return callback(err);
          let raw;
          let entry;
          try {
            entry = parsePackEntry(chunk);
            if (entry.type === "ref-delta") {
              return loadRaw.call(repo, entry.ref, onBase);
            }
            else if (entry.type === "ofs-delta") {
              return loadChunk(packFile, start - entry.ref, onBase);
            }
            raw = codec.frame(entry);
          }
          catch (err) { return callback(err); }
          callback(null, raw);

          function onBase(err, base) {
            if (!base) return callback(err);
            const object = codec.deframe(base);
            let buffer;
            try {
              object.body = applyDelta(entry.body, object.body);
              buffer = codec.frame(object);
            }
            catch (err) { return callback(err); }
            callback(null, buffer);
          }
        });
      }

    }
  }

  function hashToPath(hash) {
    return pathJoin(repo.rootPath, "objects", hash.substring(0, 2), hash.substring(2));
  }

};

function parseIndex(buffer) {
  if (readUint32(buffer, 0) !== 0xff744f63 ||
      readUint32(buffer, 4) !== 0x00000002) {
    throw new Error("Only v2 pack indexes supported");
  }

  // Get the number of hashes in index
  // This is the value of the last fan-out entry
  let hashOffset = 8 + 255 * 4;
  const length = readUint32(buffer, hashOffset);
  hashOffset += 4;
  const crcOffset = hashOffset + 20 * length;
  const lengthOffset = crcOffset + 4 * length;
  const largeOffset = lengthOffset + 4 * length;
  let checkOffset = largeOffset;
  const indexes = new Array(length);
  for (let i = 0; i < length; i++) {
    const start = hashOffset + i * 20;
    const hash = bodec.toHex(bodec.slice(buffer, start, start + 20));
    const crc = readUint32(buffer, crcOffset + i * 4);
    let offset = readUint32(buffer, lengthOffset + i * 4);
    if (offset & 0x80000000) {
      offset = largeOffset + (offset &0x7fffffff) * 8;
      checkOffset = Math.max(checkOffset, offset + 8);
      offset = readUint64(buffer, offset);
    }
    indexes[i] = {
      hash: hash,
      offset: offset,
      crc: crc
    };
  }
  const packChecksum = bodec.toHex(bodec.slice(buffer, checkOffset, checkOffset + 20));
  const checksum = bodec.toHex(bodec.slice(buffer, checkOffset + 20, checkOffset + 40));
  if (sha1(bodec.slice(buffer, 0, checkOffset + 20)) !== checksum) {
    throw new Error("Checksum mistmatch");
  }

  const byHash = {};
  indexes.sort((a, b) => a.offset - b.offset);
  indexes.forEach(data => {
    byHash[data.hash] = {
      offset: data.offset,
      crc: data.crc,
    };
  });
  const offsets = indexes.map(entry => entry.offset).sort((a, b) => a - b);

  return {
    offsets: offsets,
    byHash: byHash,
    checksum: packChecksum
  };
}

function readUint32(buffer, offset) {
  return (buffer[offset] << 24 |
          buffer[offset + 1] << 16 |
          buffer[offset + 2] << 8 |
          buffer[offset + 3] << 0) >>> 0;
}

// Yes this will lose precision over 2^53, but that can't be helped when
// returning a single integer.
// We simply won't support packfiles over 8 petabytes. I'm ok with that.
function readUint64(buffer, offset) {
  const hi = (buffer[offset] << 24 |
            buffer[offset + 1] << 16 |
            buffer[offset + 2] << 8 |
            buffer[offset + 3] << 0) >>> 0;
  const lo = (buffer[offset + 4] << 24 |
            buffer[offset + 5] << 16 |
            buffer[offset + 6] << 8 |
            buffer[offset + 7] << 0) >>> 0;
  return hi * 0x100000000 + lo;
}
