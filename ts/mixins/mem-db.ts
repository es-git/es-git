"use strict";

import * as codec from '../lib/object-codec';
import sha1 from 'git-sha1';

import {
  IRepo,
  StringMap,
  Body,
  Type,
  Frame
} from '../types';

const isHash = /^[0-9a-f]{40}$/;

export default function mixin<T extends Constructor<{}>>(repo : T) : Constructor<IRepo> & T {
  return class MemDb extends repo implements IRepo {
    private readonly refs : StringMap
    private readonly objects : {[key : string] : Uint8Array}
    constructor(...args : any[]){
      super(...args);
      this.objects = {};
      this.refs = {};
    }

    async readRef(ref : string) {
      return this.refs[ref];
    }

    async listRefs(prefix? : string) {
      const regex = prefix && new RegExp("^" + prefix + "[/$]");
      const out : StringMap = {};
      Object.keys(this.refs).forEach(name => {
        if (regex && !regex.test(name)) return;
        out[name] = this.refs[name];
      });
      return out;
    }

    async updateRef(ref : string, hash : string) {
      this.refs[ref] = hash;
    }

    async hasHash(hash : string) {
      if (!isHash.test(hash)) hash = this.refs[hash];
      return hash in this.objects;
    }

    async saveAs(type : Type, body : Body) {
      const buffer = codec.frame({type:type,body:body} as Frame);
      const hash = sha1(buffer);
      this.objects[hash] = buffer;
      return hash;
    }

    async saveRaw(hash : string, buffer : Uint8Array) {
      this.objects[hash] = buffer;
    }

    async loadAs(type : Type, hash : string) {
      if (!isHash.test(hash)) hash = this.refs[hash];
      const buffer = this.objects[hash];
      if (!buffer) return [];
      const obj = codec.deframe(buffer, true);
      if (obj.type !== type) throw new TypeError("Type mismatch");
      return obj.body;
    }

    async loadRaw(hash : string) {
      return this.objects[hash];
    }
  }
}