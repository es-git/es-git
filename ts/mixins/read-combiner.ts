"use strict";

import {
  IRepo,
  Type,
  Dict,
  Body,
  Frame
} from '../types'

// This replaces loadAs with a version that batches concurrent requests for
// the same hash.
export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly pendingReqs : Dict<Promise<Body> & {type : Type}>
    constructor(...args : any[]){
      super(...args);
      this.pendingReqs = {};
    }

    async loadAs(type : Type, hash : string) {
      let promise = this.pendingReqs[hash];
      if (promise) {
        if (promise.type !== type) throw new Error("Type mismatch");
        else return promise;
      }
      const result = super.loadAs(type, hash) as any;
      result.type = type;
      promise = this.pendingReqs[hash] = result;
      promise.then(() => {delete this.pendingReqs[hash]});
      return promise;
    }
  }
}