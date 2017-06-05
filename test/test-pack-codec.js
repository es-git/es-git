import bodec from 'bodec';
import run from './run.js';
import {decoders} from '../lib/object-codec.js';
import {encoders} from '../lib/object-codec.js';

// The thing we mean to test.
import codec from '../lib/pack-codec.js';

import pack from './sample-pack.js';
let items = [];
let newPack;

function unpackStream(stream) {
  let meta;
  const out = [];
  let finished = false;
  const write = codec.decodePack(onItem);
  for (let i = 0, l = stream.length; i < l; i += 128) {
    const slice = bodec.slice(stream, i, i + 128);
    try {
      // console.log("SLICE", slice);
      write(slice);
    }
    catch (err) {
      throw err;
    }
  }
  write();

  function onItem(item) {
    // console.log("UNPACK", item);
    if (item === undefined) {
      finished = true;
    }
    else if (!meta) {
      meta = item;
    }
    else {
      out.push(item);
    }
  }
  if (!finished) throw new Error("unpack stream didn't finish");
  if (out.length !== meta.num) throw new Error("Item num mismatch");
  return out;
}


run([
  function testDecodePack() {
    const counts = {};
    items = unpackStream(pack).map(item => {
      counts[item.type] = counts[item.type] || 0;
      counts[item.type]++;
      if (item.type === "tree" || item.type === "tag" || item.type === "commit") {
        item.body = decoders[item.type](item.body);
      }
      return item;
    });
    if (counts.commit !== 6) throw new Error("Wrong number of commits parsed");
    if (counts.tree !== 4) throw new Error("Wrong number of trees parsed");
    if (counts.blob !== 4) throw new Error("Wrong number of blobs parsed");
    if (counts['ofs-delta'] !== 2) throw new Error("Wrong number of offset deltas parsed");
  },
  function testEncodePack() {
    let done = false;
    const outs = [];

    const write = codec.encodePack(item => {
      if (item === undefined) {
        done = true;
        return;
      }
      if (!bodec.isBinary(item)) throw new Error("encode output must be buffers");
      outs.push(item);
    });
    write({num:items.length});
    items.forEach(item => {
      if (!bodec.isBinary(item.body)) {
        item.body = encoders[item.type](item.body);
        }
      write(item);
    });
    write();

    if (!done) throw new Error("Output stream never ended");

    newPack = bodec.join(outs);
  },
  function verifyEncodePack() {
    try {
      unpackStream(newPack);
      if (bodec.toHex(pack) !== bodec.toHex(newPack)) {
        throw new Error("Final pack doesn't match original.");
      }
    }
    catch (err) {
      console.log(bodec.toHex(pack));
      console.log(bodec.toHex(newPack));
      throw err;
    }
  }
]);
