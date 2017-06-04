import {cache} from './mem-cache';
import modes from '../lib/modes';

export default function (repo) {
  repo.pathToEntry = pathToEntry;
};

function pathToEntry(rootTree, path, callback) {
  if (!callback) return pathToEntry.bind(this, rootTree, path);
  const repo = this;
  let mode = modes.tree;
  let hash = rootTree;
  const parts = path.split("/").filter(Boolean);
  let index = 0;
  let cached;
  loop();
  function loop() {
    while (index < parts.length) {
      if (mode === modes.tree) {
        cached = cache[hash];
        if (!cached) return repo.loadAs("tree", hash, onLoad);
        const entry = cached[parts[index]];
        if (!entry) return callback();
        mode = entry.mode;
        hash = entry.hash;
        index++;
        continue;
      }
      if (modes.isFile(mode)) return callback();
      return callback(null, {
        last: {
          mode: mode,
          hash: hash,
          path: parts.slice(0, index).join("/"),
          rest: parts.slice(index).join("/"),
        }
      });
    }
    callback(null, {
      mode: mode,
      hash: hash
    });
  }

  function onLoad(err, value) {
    if (!value) return callback(err || new Error("Missing object: " + hash));
    cache[hash] = value;
    loop();
  }

}
