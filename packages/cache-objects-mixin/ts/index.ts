import { Constructor, Hash } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

import LRU, { Options } from './lru';

export type CachedObjectRepoConstructor<T> =
  new(options : Options, ...args : any[]) => T;

export default function cacheObjectsMixin<T extends Constructor<IObjectRepo>>(repo : T)
: T & CachedObjectRepoConstructor<IObjectRepo> {
  return class CachedObjectRepo extends repo {
    private readonly hashToObjectCache : LRU<Hash, GitObject>
    private readonly objectToHashCache : LRU<GitObject, Hash>
    constructor(...args : any[])
    constructor(options : Options, ...args : any[]){
      super(...args);
      this.hashToObjectCache = new LRU(options);
      this.objectToHashCache = new LRU(options);
    }

    async saveObject(object : GitObject) {
      const cached = this.objectToHashCache.get(object);
      if(cached) {
        this.hashToObjectCache.get(cached);
        return cached;
      }
      const hash = await super.saveObject(object);
      if(object){
        this.hashToObjectCache.set(hash, object);
        this.objectToHashCache.set(object, hash);
      }
      return hash;
    }

    async loadObject(hash : Hash) {
      const cached = this.hashToObjectCache.get(hash);
      if(cached) {
        this.objectToHashCache.get(cached);
        return cached;
      }
      const object = await super.loadObject(hash);
      if(object){
        this.hashToObjectCache.set(hash, object);
        this.objectToHashCache.set(object, hash);
      }
      return object;
    }
  }
}