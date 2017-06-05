"use strict";

/*global indexedDB*/

import * as codec from '../lib/object-codec.js';

import sha1 from 'git-sha1';
import modes from '../lib/modes.js';

import {
  IRepo,
  Body,
  Type
}

export async function init(name = "tedit") {
  const request = indexedDB.open(name, 1);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = evt => {
    const db = evt.target.result;

    if (evt.dataLoss && evt.dataLoss !== "none") {
      return Promise.reject(new Error(evt.dataLoss + ": " + evt.dataLossMessage));
    }

    // A versionchange transaction is started automatically.
    evt.target.transaction.onerror = e => console.error(e);

    if(db.objectStoreNames.contains("objects")) {
      db.deleteObjectStore("objects");
    }
    if(db.objectStoreNames.contains("refs")) {
      db.deleteObjectStore("refs");
    }

    db.createObjectStore("objects", {keyPath: "hash"});
    db.createObjectStore("refs", {keyPath: "path"});
  };

  return await promisify(request, evt => evt.target.result as IDBDatabase, e => e);
}


export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly db : IDBDatabase
    constructor(db : IDBDatabase, ...args : any[]) {
      super(...args);

      this.db = db;
    }

    async saveAs(type : Type, body : Body, forcedHash? : string) {
      const buffer = codec.frame({type:type,body:body});
      const hash = forcedHash || sha1(buffer);
      const trans = this.db.transaction(["objects"], "readwrite");
      const store = trans.objectStore("objects");
      const entry = { hash: hash, type: type, body: body };
      const request = store.put(entry);
      return await promisify(request, () => hash, evt => new Error(evt.value));
    }

    async loadAs(type : Type, hash : string) : Promise<Body> {
      const entry = await this.loadRaw(hash);
      if (type !== entry.type) {
        throw new TypeError("Type mismatch");
      }
      return entry.body;
    }

    async loadRaw(hash : string) : Promise<Uint8Array> {
      const trans = this.db.transaction(["objects"], "readwrite");
      const store = trans.objectStore("objects");
      const request = store.get(hash);
      return await promisify(request, evt => evt.target.result as Body, evt => new Error(evt.value));
    }

    async hasHash(hash : string) : Promise<boolean> {
      const body = await this.loadRaw(hash);
      return !!body;
    }

    async readRef(ref : string) : Promise<string> {
      const trans = this.db.transaction(["refs"], "readwrite");
      const store = trans.objectStore("refs");
      const request = store.get(ref);
      return await promisify(request, evt => evt.target.result && evt.target.result.hash, evt => new Error(evt.value));
    }

    async updateRef(ref : string, hash : string) : Promise<void> {
      const trans = this.db.transaction(["refs"], "readwrite");
      const store = trans.objectStore("refs");
      const entry = { path: ref, hash: hash };
      const request = store.put(entry);
      return await promisify(request, x => x, evt => new Error(evt.value));
    }
  }
}

function promisify<T extends IDBRequest, TR>(request : T, success : (evt : any) => TR, error : (evt : any) => any){
  return new Promise<TR>((res, rej) => {
    request.onsuccess = evt => res(success(evt));
    request.onerror = evt => rej(error(evt));
  });
}