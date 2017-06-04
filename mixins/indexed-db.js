"use strict";

/*global indexedDB*/

import * as codec from '../lib/object-codec.js';

import sha1 from 'git-sha1';
import modes from '../lib/modes.js';
let db;

export function init(callback) {

  db = null;
  const request = indexedDB.open("tedit", 1);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = evt => {
    const db = evt.target.result;

    if (evt.dataLoss && evt.dataLoss !== "none") {
      return callback(new Error(evt.dataLoss + ": " + evt.dataLossMessage));
    }

    // A versionchange transaction is started automatically.
    evt.target.transaction.onerror = onError;

    if(db.objectStoreNames.contains("objects")) {
      db.deleteObjectStore("objects");
    }
    if(db.objectStoreNames.contains("refs")) {
      db.deleteObjectStore("refs");
    }

    db.createObjectStore("objects", {keyPath: "hash"});
    db.createObjectStore("refs", {keyPath: "path"});
  };

  request.onsuccess = evt => {
    db = evt.target.result;
    callback();
  };
  request.onerror = onError;
}


export default function mixin(repo, prefix) {
  if (!prefix) throw new Error("Prefix required");
  repo.refPrefix = prefix;
  repo.saveAs = saveAs;
  repo.loadAs = loadAs;
  repo.readRef = readRef;
  repo.updateRef = updateRef;
  repo.hasHash = hasHash;
}

function onError(evt) {
  console.error("error", evt.target.error);
}

export function saveAs(type, body, callback, forcedHash) {
  if (!callback) return saveAs.bind(this, type, body);
  let hash;
  try {
    const buffer = codec.frame({type:type,body:body});
    hash = forcedHash || sha1(buffer);
  }
  catch (err) { return callback(err); }
  const trans = db.transaction(["objects"], "readwrite");
  const store = trans.objectStore("objects");
  const entry = { hash: hash, type: type, body: body };
  const request = store.put(entry);
  request.onsuccess = () => {
    // console.warn("SAVE", type, hash);
    callback(null, hash, body);
  };
  request.onerror = evt => {
    callback(new Error(evt.value));
  };
}

export function loadAs(type, hash, callback) {
  if (!callback) return loadAs.bind(this, type, hash);
  loadRaw(hash, (err, entry) => {
    if (!entry) return callback(err);
    if (type !== entry.type) {
      return callback(new TypeError("Type mismatch"));
    }
    callback(null, entry.body, hash);
  });
}

function loadRaw(hash, callback) {
  const trans = db.transaction(["objects"], "readwrite");
  const store = trans.objectStore("objects");
  const request = store.get(hash);
  request.onsuccess = evt => {
    const entry = evt.target.result;
    if (!entry) return callback();
    return callback(null, entry);
  };
  request.onerror = evt => {
    callback(new Error(evt.value));
  };
}

function hasHash(hash, callback) {
  if (!callback) return hasHash.bind(this, hash);
  loadRaw(hash, (err, body) => {
    if (err) return callback(err);
    return callback(null, !!body);
  });
}

function readRef(ref, callback) {
  if (!callback) return readRef.bind(this, ref);
  const key = this.refPrefix + "/" + ref;
  const trans = db.transaction(["refs"], "readwrite");
  const store = trans.objectStore("refs");
  const request = store.get(key);
  request.onsuccess = evt => {
    const entry = evt.target.result;
    if (!entry) return callback();
    callback(null, entry.hash);
  };
  request.onerror = evt => {
    callback(new Error(evt.value));
  };
}

function updateRef(ref, hash, callback) {
  if (!callback) return updateRef.bind(this, ref, hash);
  const key = this.refPrefix + "/" + ref;
  const trans = db.transaction(["refs"], "readwrite");
  const store = trans.objectStore("refs");
  const entry = { path: key, hash: hash };
  const request = store.put(entry);
  request.onsuccess = () => {
    callback();
  };
  request.onerror = evt => {
    callback(new Error(evt.value));
  };
}
