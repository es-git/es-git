"use strict";

import {encoders} from '../lib/object-codec';
import {decoders} from '../lib/object-codec';
import {Binary} from 'bodec';

const cache = {};

export {cache};

export default function memCache(repo) {
  const loadAs = (type, hash) => repo.loadAs(type, hash);
  repo.loadAs = loadAsCached;
  async function loadAsCached(type, hash) {
    if (hash in cache) return dupe(type, cache[hash]);
    const value = await loadAs.call(repo, type, hash);
    if (type !== "blob" || value.length < 100) {
      cache[hash] = dupe(type, value);
    }
    return value;
  }

  const saveAs = (type, value) => repo.saveAs(type, value);
  repo.saveAs = saveAsCached;
  async function saveAsCached(type, value) {
    value = dupe(type, value);
    const hash = await saveAs.call(repo, type, value);
    if (type !== "blob" || value.length < 100) {
      cache[hash] = value;
    }
    return hash;
  }
}
function dupe(type, value) {
  if (type === "blob") {
    if (type.length >= 100) return value;
    return new Binary(value);
  }
  return decoders[type](encoders[type](value));
}

function deepFreeze(obj) {
  Object.freeze(obj);
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === "object") deepFreeze(value);
  });
}
