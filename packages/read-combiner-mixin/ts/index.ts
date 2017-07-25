import { Type, Mode, Constructor, IRawRepo, Hash } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

export default function mixin<T extends Constructor<IObjectRepo>>(repo : T) : Constructor<IObjectRepo> & T {
  return class ReadCombinerRepo extends repo implements IObjectRepo {
    private readonly pendingReqs : Map<Hash, Promise<GitObject | undefined>>
    constructor(...args : any[]){
      super(...args);
      this.pendingReqs = new Map<Hash, Promise<GitObject | undefined>>();
    }

    async loadObject(hash : Hash) {
      const promise = this.pendingReqs.get(hash);
      if (promise) {
        return promise;
      }
      const result = super.loadObject(hash);
      this.pendingReqs.set(hash, result);
      result.then(() => this.pendingReqs.delete(hash), () => this.pendingReqs.delete(hash));
      return result;
    }
  }
}