"use strict";
import * as bodec from 'bodec';
import inflate from '../lib/inflate';
import deflate from '../lib/deflate';
import * as codec from '../lib/object-codec';
import {parseEntry as parsePackEntry} from '../lib/pack-codec';
import applyDelta from '../lib/apply-delta';
import sha1 from 'git-sha1';
import {join as pathJoin} from 'path';

import {
  IRepo,
  StringMap,
  Body,
  Type,
  Frame
} from '../types';

export interface AsyncFileSystem {
  readFile(path : string) : Promise<Uint8Array>
  readChunk(path : string, start : number, end : number) : Promise<Uint8Array>
  writeFile(path : string, binary : Uint8Array) : Promise<void>
  writeFile(path : string, string : string) : Promise<void>
  readDir(path : string) : Promise<string[]>
  rename(from : string, to : string) : Promise<void>
}

export interface WithRootPath {
  readonly rootPath : string
}

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
export default function mixin<T extends Constructor<WithRootPath>>(repo : T) : Constructor<IRepo> & T {
  return class FsDb extends repo implements IRepo {
    private readonly fs : AsyncFileSystem
    private readonly cachedIndexes : { [key : string] : any}
    constructor(...args : any[])
    constructor(fs : AsyncFileSystem, ...args : any[]) {
      super(...args);

      this.fs = fs;
      this.cachedIndexes = {};
    }

    async init(ref : string) {
      ref = ref || "refs/heads/master";
      const path = pathJoin(this.rootPath, "HEAD");
      return await this.fs.writeFile(path, "ref: " + ref);
    }

    async setShallow(ref : string) {
      const path = pathJoin(this.rootPath, "shallow");
      return await this.fs.writeFile(path, ref);
    }

    async updateRef(ref : string, hash : string) {
      const path = pathJoin(this.rootPath, ref);
      const lock = path + ".lock";
      await this.fs.writeFile(lock, bodec.fromRaw(hash + "\n"));
      return await this.fs.rename(lock, path);
    }

    async readRef(ref : string) {
      const path = pathJoin(this.rootPath, ref);
      const binary = await this.fs.readFile(path);
      if (binary === undefined) {
        return this.readPackedRef(ref);
      }
      return bodec.toRaw(binary).trim();
    }

    async readPackedRef(ref : string) {
      const path = pathJoin(this.rootPath, "packed-refs");
      const binary = await this.fs.readFile(path);
      const text = bodec.toRaw(binary);
      const index = text.indexOf(ref);
      if (index >= 0) {
        return text.substring(index - 41, index - 1);
      }
    }

    async saveAs(type : Type, body : Body) {
      const raw = codec.frame({
        type: type,
        body: (codec.encoders as any)[type](body)
      } as Frame);
      const hash = sha1(raw);
      await this.saveRaw(hash, raw);
      return hash;
    }

    async saveRaw(hash : string, raw : Uint8Array) {
      if (sha1(raw) !== hash) {
        throw new Error("Save data does not match hash");
      }
      const buffer = deflate(raw);
      const path = this.hashToPath(hash);
      // Try to read the object first.
      const data = await this.loadRaw(hash);
      // If it already exists, we're done
      if (data) return;
      // Otherwise write a new file
      const tmp = path.replace(/[0-9a-f]+$/, 'tmp_obj_' + Math.random().toString(36).substr(2));
      await this.fs.writeFile(tmp, buffer);
      return await this.fs.rename(tmp, path);
    }

    async loadAs(type : Type, hash : string) {
      const raw = await this.loadRaw(hash);
      const frame = codec.deframe(raw);
      if (frame.type !== type) throw new TypeError("Type mismatch");
      return (codec.decoders as any)[frame.type](frame.body) as Body;
    }

    async hasHash(hash : string) {
      const body = await this.loadRaw(hash);
      return !!body;
    }

    async loadRaw(hash : string) {
      const path = this.hashToPath(hash);
      const buffer = await this.fs.readFile(path);
      if (buffer) {
        return inflate(buffer);
      }
      return this.loadRawPacked(hash);
    }

    async loadRawPacked(hash : string) {
      const packDir = pathJoin(this.rootPath, "objects/pack");
      const entries = await this.fs.readDir(packDir);
      const packHashes = entries
        .map(name => name.match(/pack-([0-9a-f]{40}).idx/))
        .filter((match : RegExpMatchArray | null) : match is RegExpMatchArray => match != null)
        .map(match => match[1]);
      const self = this;
      return await start();

      async function start() : Promise<Uint8Array> {
        const packHash = packHashes.pop();
        if (!packHash) throw new Error("weird");
        if (!self.cachedIndexes[packHash]){
          const indexFile = pathJoin(packDir, "pack-" + packHash + ".idx" );
          const buffer = await self.fs.readFile(indexFile);
          self.cachedIndexes[packHash] = parseIndex(buffer);
        }

        const cached = self.cachedIndexes[packHash];
        const packFile = pathJoin(packDir, "pack-" + packHash + ".pack" );
        const index = cached.byHash[hash];
        if (!index) return await start();
        const offsets = cached.offsets;
        return await loadChunk(packFile, index.offset);

        async function loadChunk(packFile : string, start : number) : Promise<Uint8Array> {
          const index = offsets.indexOf(start);
          if (index < 0) {
            throw new Error("Can't find chunk starting at " + start);
          }

          const end = index + 1 < offsets.length ? offsets[index + 1] : -20;
          const chunk = await self.fs.readChunk(packFile, start, end);
          let entry = parsePackEntry(chunk);
          if (entry.type === "ref-delta") {
            return await self.loadRaw(entry.ref);
          } else if (entry.type === "ofs-delta") {
            const base = await loadChunk(packFile, start - entry.ref);
            const object = codec.deframe(base) as any;
            object.body = applyDelta(entry.body, object.body);
            return codec.frame(object);
          }
          return codec.frame(entry);
        }
      }
    }

    hashToPath(hash : string) {
      return pathJoin(this.rootPath, "objects", hash.substring(0, 2), hash.substring(2));
    }
  }
};

type HashOffsetCrc = {
  hash : string,
  offset : number,
  crc : number
}

type ParsedIndex = {
  readonly offsets : number[],
  readonly byHash : {
    [key : string] : {
      readonly offset : number
      readonly crc : number
    }
  }
  readonly checksum : string
}

function parseIndex(buffer : Uint8Array) : ParsedIndex {
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
  const indexes : HashOffsetCrc[] = new Array(length);
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

  const byHash : { [key : string] : {offset : number, crc : number}} = {};
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

function readUint32(buffer : Uint8Array, offset : number) {
  return (buffer[offset] << 24 |
          buffer[offset + 1] << 16 |
          buffer[offset + 2] << 8 |
          buffer[offset + 3] << 0) >>> 0;
}

// Yes this will lose precision over 2^53, but that can't be helped when
// returning a single integer.
// We simply won't support packfiles over 8 petabytes. I'm ok with that.
function readUint64(buffer : Uint8Array, offset : number) {
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
