"use strict";

import defer from '../lib/defer.js';
import * as codec from '../lib/object-codec.js';
import sha1 from 'git-sha1';
export default mixin;
const isHash = /^[0-9a-f]{40}$/;

function mixin(repo) {
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

  function readRef(ref, callback) {
    return makeAsync(() => refs[ref], callback);
  }

  function listRefs(prefix, callback) {
    return makeAsync(() => {
      const regex = prefix && new RegExp("^" + prefix + "[/$]");
      const out = {};
      Object.keys(refs).forEach(name => {
        if (regex && !regex.test(name)) return;
        out[name] = refs[name];
      });
      return out;
    }, callback);
  }

  function updateRef(ref, hash, callback) {
    return makeAsync(() => refs[ref] = hash, callback);
  }

  function hasHash(hash, callback) {
    return makeAsync(() => {
      if (!isHash.test(hash)) hash = refs[hash];
      return hash in objects;
    }, callback);
  }

  function saveAs(type, body, callback) {
    return makeAsync(() => {
      const buffer = codec.frame({type:type,body:body});
      const hash = sha1(buffer);
      objects[hash] = buffer;
      return hash;
    }, callback);
  }

  function saveRaw(hash, buffer, callback) {
    return makeAsync(() => {
      objects[hash] = buffer;
    }, callback);
  }

  function loadAs(type, hash, callback) {
    return makeAsync(() => {
      if (!isHash.test(hash)) hash = refs[hash];
      const buffer = objects[hash];
      if (!buffer) return [];
      const obj = codec.deframe(buffer, true);
      if (obj.type !== type) throw new TypeError("Type mismatch");
      return obj.body;
    }, callback);
  }

  function loadRaw(hash, callback) {
    return makeAsync(() => objects[hash], callback);
  }
}

function makeAsync(fn, callback) {
  if (!callback) return makeAsync.bind(null, fn);
  defer(() => {
    let out;
    try { out = fn(); }
    catch (err) { return callback(err); }
    callback(null, out);
  });
}
