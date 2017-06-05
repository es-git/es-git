import run from './run.js';
import bodec from 'bodec';

// The thing we mean to test.
import inflate from '../lib/inflate.js';

import deflate from '../lib/deflate.js';
import inflateStream from '../lib/inflate-stream.js';

const bin = bodec.create(1024);
for (let i = 0; i < 1024; i++) {
  bin[i] = i >> 2 | i % 4 & 0x7f;
}

run([
  function testRoundTrip() {
    const deflated = deflate(bin);
    if (!bodec.isBinary(deflated)) {
      throw new Error("deflate output should be native binary");
    }
    const inflated = inflate(deflated);
    if (!bodec.isBinary(inflated)) {
      throw new Error("inflate output should be native binary");
    }
    if (bodec.toRaw(bin) !== bodec.toRaw(inflated)) {
      console.log([bin, inflated]);
      throw new Error("Problem with roundtrip");
    }
  },
  function testStream() {
    const done = false;
    const chunks = [];
    const deflated = deflate(bin);
    const inf = inflateStream();

    for (let i = 0, l = deflated.length; i < l; ++i) {
      inf.write(deflated[i]);
    }
    const inflated = inf.flush();
    if (bodec.toRaw(bin) !== bodec.toRaw(inflated)) {
      console.log([bin.length, inflated.length]);
      throw new Error("Problem with roundtrip");
    }
  }
]);
