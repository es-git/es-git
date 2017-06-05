"use strict";

/*global indexedDB*/

import * as codec from '../lib/object-codec.js';

import sha1 from 'git-sha1';
import modes from '../lib/modes.js';
let db;

export async function init() {

  db = null;
  const request = indexedDB.open("tedit", 1);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = evt => {
    const db = evt.target.result;

    if (evt.dataLoss && evt.dataLoss !== "none") {
      return Promise.reject(new Error(evt.dataLoss + ": " + evt.dataLossMessage));
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

  return await promisify(request, evt => db = evt.target.result, e => e);
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

export async function saveAs(type, body, forcedHash) {
  const buffer = codec.frame({type:type,body:body});
  const hash = forcedHash || sha1(buffer);
  const trans = db.transaction(["objects"], "readwrite");
  const store = trans.objectStore("objects");
  const entry = { hash: hash, type: type, body: body };
  const request = store.put(entry);
  return await promisify(request, () => hash, evt => new Error(evt.value));
}

export async function loadAs(type, hash) {
  const entry = await loadRaw(hash);
  if (type !== entry.type) {
    throw new TypeError("Type mismatch");
  }
  return entry.body;
}

async function loadRaw(hash) {
  const trans = db.transaction(["objects"], "readwrite");
  const store = trans.objectStore("objects");
  const request = store.get(hash);
  return await promisify(request, evt => evt.target.result, evt => new Error(evt.value));
}

async function hasHash(hash) {
  const body = await loadRaw(hash);
  return !!body;
}

async function readRef(ref) {
  const key = this.refPrefix + "/" + ref;
  const trans = db.transaction(["refs"], "readwrite");
  const store = trans.objectStore("refs");
  const request = store.get(key);
  return await promisify(request, evt => evt.target.result && evt.target.result.hash, evt => new Error(evt.value));
}

async function updateRef(ref, hash) {
  const key = this.refPrefix + "/" + ref;
  const trans = db.transaction(["refs"], "readwrite");
  const store = trans.objectStore("refs");
  const entry = { path: key, hash: hash };
  const request = store.put(entry);
  return await promisify(request, x => x, evt => new Error(evt.value));
}

function promisify(request, success, error){
  return new Promise((res, rej) => {
    request.onsuccess = evt => res(success);
    request.onerror = evt => rej(error);
  });
}