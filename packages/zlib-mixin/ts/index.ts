import { Constructor, IRawRepo, Hash } from '@es-git/core';
import * as pako from 'pako';

export default function zlibMixin<T extends Constructor<IRawRepo>>(repo : T) : T {
  return class CompressedRepo extends repo implements IRawRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async saveRaw(hash : Hash, raw : Uint8Array) {
      await super.saveRaw(hash, pako.deflate(raw));
    }

    async loadRaw(hash : Hash) {
      const raw = await super.loadRaw(hash);
      return raw ? pako.inflate(raw) : undefined;
    }
  }
}