"use strict";

import modes from '../lib/modes';

import {
  IRepo,
  Type,
  Body,
  CommitBody,
  TreeBody,
  Dict
} from '../types'

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly remote : IRepo
    constructor(remote : IRepo, ...args : any[]) {
      super(...args);
      this.remote = remote;
    }

    async fetch(ref : string, depth : number) {
      return sync(this, this.remote, ref, depth);
    }

    async send(ref : string) {
      return sync(this.remote, this, ref, Infinity);
    }
  };

  // Download remote ref with depth
  // Make sure to use Infinity for depth on github mounts or anything that
  // doesn't allow shallow clones.
  async function sync(local : IRepo, remote : IRepo, ref : string, depth : number) {
    if (typeof ref !== "string") throw new TypeError("ref must be string");
    if (typeof depth !== "number") throw new TypeError("depth must be number");

    const hasCache : Dict<boolean> = {};

    const hash = await remote.readRef(ref);
    await importCommit(hash, depth);
    return hash;

    // Caching has check.
    async function check(type : Type, hash : string) {
      if (typeof type !== "string") throw new TypeError("type must be string");
      if (typeof hash !== "string") throw new TypeError("hash must be string");
      if (hasCache[hash]) return true;
      const has = await local.hasHash(hash);
      hasCache[hash] = has;
      return has;
    }

    async function importCommit(hash : string, depth : number) {
      const has = await check("commit", hash);

      const commit = await remote.loadAs("commit", hash) as CommitBody;

      if (!commit) throw new Error("Missing commit " + hash);
      let i = 0;
      await importTree(commit.tree);
      if (i >= commit.parents.length || depth <= 1) {
        const newHash = await local.saveAs("commit", commit);
        if (newHash !== hash) {
          throw new Error("Commit hash mismatch " + hash + " != " + newHash);
        }
        hasCache[hash] = true;
        return
      }
      await importCommit(commit.parents[i++], depth - 1);
    }

    async function importTree(hash : string) : Promise<void> {
      const has = await check("tree", hash);
      if(has) return;

      const tree = await remote.loadAs("tree", hash) as TreeBody;
      if (!tree) throw new Error("Missing tree " + hash);
      let i = 0;
      const names = Object.keys(tree);

      while(true){
        if (i >= names.length) {
          const newHash = await local.saveAs("tree", tree);
          if (newHash !== hash) {
            throw new Error("Tree hash mismatch " + hash + " != " + newHash);
          }
          hasCache[hash] = true;
          return
        }
        const name = names[i++];
        const entry = tree[name];
        if (modes.isBlob(entry.mode)) {
          return await importBlob(entry.hash);
        }else if (entry.mode === modes.tree) {
          return await importTree(entry.hash);
        }
        // Skip others.
      }
    }

    async function importBlob(hash : string) {
      const has = await check("blob", hash);
      if(has) return;

      const blob = await remote.loadAs("blob", hash) as Uint8Array;

      if (!blob) throw new Error("Missing blob " + hash);
      const newHash = await local.saveAs("blob", blob);
      if (newHash !== hash) throw new Error("Blob hash mismatch " + hash + " != " + newHash);
      hasCache[hash] = true;
    }
  }
}