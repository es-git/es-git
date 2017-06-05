import {cache} from './mem-cache';
import modes from '../lib/modes';

export default function (repo) {
  repo.pathToEntry = pathToEntry;
};

async function pathToEntry(rootTree, path) {
  const repo = this;
  let mode = modes.tree;
  let hash = rootTree;
  const parts = path.split("/").filter(Boolean);
  let index = 0;
  let cached;
  while (index < parts.length) {
    if (mode === modes.tree) {
      cached = cache[hash];
      if (!cached) {
        const value = await repo.loadAs("tree", hash);
        if (!value) throw new Error("Missing object: " + hash);
        cache[hash] = value;
        continue;
      }
      const entry = cached[parts[index]];
      if (!entry) return undefined;
      mode = entry.mode;
      hash = entry.hash;
      index++;
      continue;
    }
    if (modes.isFile(mode)) return undefined;
    return {
      last: {
        mode: mode,
        hash: hash,
        path: parts.slice(0, index).join("/"),
        rest: parts.slice(index).join("/"),
      }
    };
  }
  return {
    mode: mode,
    hash: hash
  };
}
