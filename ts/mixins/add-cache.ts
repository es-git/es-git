"use strict";

import {
  IRepo,
  Type,
  Body
} from '../types'

export interface ICache {
  loadAs(type : Type, hash : string) : Promise<Body>
  saveAs(type : Type, body : Body, hash : string) : Promise<void>
}

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly cache : ICache
    constructor(...args : any[])
    constructor(cache : ICache, ...args : any[]){
      super(...args)
    }

    async loadAs(type : Type, hash : string) {
      // Next check in disk cache...
      let value = await this.cache.loadAs(type, hash);

      // ...and return if it's there.
      if (value !== undefined) {
        return value;
      }

      // Otherwise load from real data source...
      value = await super.loadAs(type, hash);

      // Store it on disk too...
      // Force the hash to prevent mismatches.
      await this.cache.saveAs(type, value, hash);
    }

    async saveAs(type : Type, value : Body) {
      const hash = await super.saveAs(type, value);

      // Store in disk, forcing hash to match.
      this.cache.saveAs(type, value, hash);

      return hash;
    }

    async createTree(entries : {}[] | {}) {
      const [hash, tree] = await super.createTree(entries);
      await this.cache.saveAs("tree", tree, hash);
    }
  }
}
