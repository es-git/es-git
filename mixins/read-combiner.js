"use strict";

// This replaces loadAs with a version that batches concurrent requests for
// the same hash.
export default function (repo) {
  const pendingReqs = {};

  const loadAs = (type, hash) => repo.loadAs(type, hash);
  repo.loadAs = newLoadAs;

  async function newLoadAs(type, hash) {
    let promise = pendingReqs[hash];
    if (promise) {
      if (promise.type !== type) throw new Error("Type mismatch");
      else return promise;
    }
    promise = pendingReqs[hash] = loadAs(type, hash);
    promise.type = type;
    promise.then(() => {delete pendingReqs[hash]});
  }
};
