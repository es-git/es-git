import modes from '../lib/modes';

import {
  IRepo
} from '../types';

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    async pathToEntry(rootTree : string, path : string) {
      const repo = this;
      let mode = modes.tree;
      let hash = rootTree;
      const parts = path.split("/").filter(Boolean);
      let index = 0;
      let cached;
      while (index < parts.length) {
        if (mode === modes.tree) {
          cached = this.cache[hash];
          if (!cached) {
            const value = await repo.loadAs("tree", hash);
            if (!value) throw new Error("Missing object: " + hash);
            this.cache[hash] = value;
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
  }
}