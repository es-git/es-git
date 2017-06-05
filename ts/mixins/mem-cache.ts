"use strict";

import {encoders} from '../lib/object-codec';
import {decoders} from '../lib/object-codec';
import {Binary} from 'bodec';

import {
  IRepo,
  Type,
  Body
} from '../types'

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly cache : { [key : string] : any }
    constructor(...args : any[]) {
      super(...args);
      this.cache = {};
    }

    async loadAs(type : Type, hash : string) : Promise<Body> {
      if (hash in this.cache) return dupe(type, this.cache[hash]);
      const value = await super.loadAs(type, hash);
      if (type !== "blob" || (value as any).length < 100) {
        this.cache[hash] = dupe(type, value);
      }
      return value;
    }

    async saveAs(type : Type, value : Body) {
      value = dupe(type, value);
      const hash = await super.saveAs(type, value);
      if (type !== "blob" || (value as any).length < 100) {
        this.cache[hash] = value;
      }
      return hash;
    }
  }
}

function dupe(type : Type, value : Body) {
  if (type === "blob") {
    if (type.length >= 100) return value;
    return new Binary(value as Uint8Array);
  }
  return decoders[type]((encoders[type] as any)(value as any) as any);
}
