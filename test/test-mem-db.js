import run from './run.js';
import bodec from 'bodec';
import sha1 from 'git-sha1';
import codec from '../lib/object-codec.js';

const repo = {};
require('../mixins/mem-db.js')(repo);

const blob = bodec.fromUnicode("Hello World\n");
const blobHash = "557db03de997c86a4a028e1ebd3a1ceb225be238";
run([
  function testSaveAs(end) {
    repo.saveAs("blob", blob, (err, hash) => {
      if (err) return end(err);
      if (hash !== blobHash) {
        console.log([hash, blobHash]);
        return end(new Error("Hash mismatch"));
      }
      end();
    });
  },
  function testLoadRaw(end) {
    repo.loadRaw(blobHash, (err, bin) => {
      if (err) return end(err);
      const obj = codec.deframe(bin, true);
      if (obj.type !== "blob") return err(new Error("Wrong type"));
      if (bodec.toUnicode(obj.body) !== bodec.toUnicode(blob)) {
        return err(new Error("Wrong body"));
      }
      end();
    });
  },
  function testLoadAs(end) {
    repo.loadAs("blob", blobHash, (err, body) => {
      if (err) return end(err);
      if (bodec.toUnicode(body) !== bodec.toUnicode(blob)) {
        return err(new Error("Wrong body"));
      }
      end();
    });
  },
  function testSaveRaw(end) {
    const newBody = bodec.fromUnicode("A new body\n");
    const bin = codec.frame({type:"blob",body:newBody});
    const hash = sha1(bin);
    repo.saveRaw(hash, bin, err => {
      if (err) return end(err);
      repo.loadAs("blob", hash, (err, body) => {
        if (err) return end(err);
        if (bodec.toUnicode(body) !== bodec.toUnicode(newBody)) {
          return end(new Error("Body mismatch"));
        }
        end();
      });
    });
  }
]);
