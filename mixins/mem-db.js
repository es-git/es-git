"use strict";

import * as codec from '../lib/object-codec.js';
import sha1 from 'git-sha1';
const isHash = /^[0-9a-f]{40}$/;

export default repo => class extends repo {
  constructor(...args){
    super(...args);
    this.objects = {};
    this.refs = {};
  }

  async readRef(ref) {
    return this.refs[ref];
  }

  async listRefs(prefix) {
    const regex = prefix && new RegExp("^" + prefix + "[/$]");
    const out = {};
    Object.keys(this.refs).forEach(name => {
      if (regex && !regex.test(name)) return;
      out[name] = this.refs[name];
    });
    return out;
  }

  async updateRef(ref, hash) {
    this.refs[ref] = hash;
  }

  async hasHash(hash) {
    if (!isHash.test(hash)) hash = this.refs[hash];
    return hash in this.objects;
  }

  async saveAs(type, body) {
    const buffer = codec.frame({type:type,body:body});
    const hash = sha1(buffer);
    this.objects[hash] = buffer;
    return hash;
  }

  async saveRaw(hash, buffer) {
    this.objects[hash] = buffer;
  }

  async loadAs(type, hash) {
    if (!isHash.test(hash)) hash = this.refs[hash];
    const buffer = this.objects[hash];
    if (!buffer) return [];
    const obj = codec.deframe(buffer, true);
    if (obj.type !== type) throw new TypeError("Type mismatch");
    return obj.body;
  }

  async loadRaw(hash) {
    return this.objects[hash];
  }
}
