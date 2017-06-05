"use strict";

import {encoders} from '../lib/object-codec';
import {decoders} from '../lib/object-codec';
import {Binary} from 'bodec';

export default repo => class extends repo {
  constructor(...args) {
    super(...args);
    this.cache = {};
  }

  async loadAsCached(type, hash) {
    if (hash in this.cache) return dupe(type, this.cache[hash]);
    const value = await super.loadAs(type, hash);
    if (type !== "blob" || value.length < 100) {
      this.cache[hash] = dupe(type, value);
    }
    return value;
  }

  async saveAsCached(type, value) {
    value = dupe(type, value);
    const hash = await super.saveAs(type, value);
    if (type !== "blob" || value.length < 100) {
      this.cache[hash] = value;
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
