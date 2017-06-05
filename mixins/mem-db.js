"use strict";

import * as codec from '../lib/object-codec.js';
import sha1 from 'git-sha1';
const isHash = /^[0-9a-f]{40}$/;

export default function mixin(repo) {
  const objects = {};
  const refs = {};

  repo.saveAs = saveAs;
  repo.loadAs = loadAs;
  repo.saveRaw = saveRaw;
  repo.loadRaw = loadRaw;
  repo.hasHash = hasHash;
  repo.readRef = readRef;
  repo.updateRef = updateRef;
  repo.listRefs = listRefs;

  async function readRef(ref) {
    return refs[ref];
  }

  async function listRefs(prefix) {
    const regex = prefix && new RegExp("^" + prefix + "[/$]");
    const out = {};
    Object.keys(refs).forEach(name => {
      if (regex && !regex.test(name)) return;
      out[name] = refs[name];
    });
    return out;
  }

  async function updateRef(ref, hash) {
    refs[ref] = hash;
  }

  async function hasHash(hash) {
    if (!isHash.test(hash)) hash = refs[hash];
    return hash in objects;
  }

  async function saveAs(type, body) {
    const buffer = codec.frame({type:type,body:body});
    const hash = sha1(buffer);
    objects[hash] = buffer;
    return hash;
  }

  async function saveRaw(hash, buffer) {
    objects[hash] = buffer;
  }

  async function loadAs(type, hash) {
    if (!isHash.test(hash)) hash = refs[hash];
    const buffer = objects[hash];
    if (!buffer) return [];
    const obj = codec.deframe(buffer, true);
    if (obj.type !== type) throw new TypeError("Type mismatch");
    return obj.body;
  }

  async function loadRaw(hash) {
    return objects[hash];
  }
}
