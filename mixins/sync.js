"use strict";

import modes from '../lib/modes';

export default function (local, remote) {
  local.fetch = fetch;
  local.send = send;
  local.readRemoteRef = remote.readRef.bind(remote);
  local.updateRemoteRef = remote.updateRef.bind(remote);

  function fetch(ref, depth) {
    return sync(local, remote, ref, depth);
  }

  function send(ref) {
    return sync(remote, local, ref, Infinity);
  }
};

// Download remote ref with depth
// Make sure to use Infinity for depth on github mounts or anything that
// doesn't allow shallow clones.
async function sync(local, remote, ref, depth) {
  if (typeof ref !== "string") throw new TypeError("ref must be string");
  if (typeof depth !== "number") throw new TypeError("depth must be number");

  const hasCache = {};

  const hash = await remote.readRef(ref);
  await importCommit(hash, depth);
  return hash;

  // Caching has check.
  async function check(type, hash) {
    if (typeof type !== "string") throw new TypeError("type must be string");
    if (typeof hash !== "string") throw new TypeError("hash must be string");
    if (hasCache[hash]) return true;
    const has = await local.hasHash(hash);
    hasCache[hash] = has;
    return has;
  }

  async function importCommit(hash, depth) {
    const has = await check("commit", hash);

    const commit = await remote.loadAs("commit", hash);

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

  async function importTree(hash) {
    const has = await check("tree", hash);
    if(has) return;

    const tree = await remote.loadAs("tree", hash);
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

  async function importBlob(hash) {
    const has = await check("blob", hash);
    if(has) return;

    const blob = await remote.loadAs("blob", hash);

    if (!blob) throw new Error("Missing blob " + hash);
    const newHash = await local.saveAs("blob", blob);
    if (newHash !== hash) throw new Error("Blob hash mismatch " + hash + " != " + newHash);
    hasCache[hash] = true;
  }
}
