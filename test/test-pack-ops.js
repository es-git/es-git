import run from './run.js';

const repo = {};
require('../mixins/mem-db.js')(repo);

import pack from './sample-pack.js';
let hashes;

run([
  function setup() {
    require('../mixins/pack-ops.js')(repo);
  },
  function testUnpack(end) {
    repo.unpack(singleStream(pack), {
      onProgress: onProgress
    }, (err, result) => {
      if (err) return end(err);
      hashes = result;
      if (hashes.length !== 16) {
        return end(new Error("Wrong number of objects unpacked"));
      }
      end();
    });
    function onProgress(progress) {
      // console.log(progress);
    }
  },
  function testPack(end) {
    let stream;
    const parts = [];
    repo.pack(hashes, {}, (err, result) => {
      if (err) return end(err);
      stream = result;
      stream.take(onRead);
    });
    function onRead(err, chunk) {
      if (err) return end(err);
      // console.log(chunk);
      if (chunk) {
        parts.push(chunk);
        return stream.take(onRead);
      }
      end();
    }
  }
]);

function singleStream(item) {
  let done = false;
  return { take: function (callback) {
    if (done) return callback();
    done = true;
    callback(null, item);
  }};
}