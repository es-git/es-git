"use strict";

// This replaces loadAs with a version that batches concurrent requests for
// the same hash.
export default repo => class extends repo {
  constructor(...args){
    super(...args);
    this.pendingReqs = {};
  }

  async loadAs(type, hash) {
    let promise = this.pendingReqs[hash];
    if (promise) {
      if (promise.type !== type) throw new Error("Type mismatch");
      else return promise;
    }
    promise = this.pendingReqs[hash] = super.loadAs(type, hash);
    promise.type = type;
    promise.then(() => {delete this.pendingReqs[hash]});
  }
};
