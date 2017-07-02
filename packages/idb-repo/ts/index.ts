import idb, { DB } from 'idb';

import { IRawRepo, Types, Body, RawObject } from '@es-git/core';

export { DB };

export async function init(name : string) {
  const database = await idb.open(name, 1, db => {
    if(db.objectStoreNames.contains("objects")) {
      db.deleteObjectStore("objects");
    }
    if(db.objectStoreNames.contains("refs")) {
      db.deleteObjectStore("refs");
    }

    db.createObjectStore("objects", {keyPath: "hash"});
    db.createObjectStore("refs", {keyPath: "path"});
  });

  return database;
}


export default class IdbRepo implements IRawRepo {
  private readonly db : DB
  constructor(db : DB) {
    this.db = db;
  }

  async saveRaw(raw : RawObject) : Promise<void> {
    const trans = this.db.transaction(["objects"], "readwrite");
    const store = trans.objectStore("objects");
    await store.put(raw);
  }

  async loadRaw(hash : string) : Promise<RawObject | undefined> {
    const trans = this.db.transaction(["objects"], "readwrite");
    const store = trans.objectStore("objects");
    return await store.get(hash);
  }

  async hasHash(hash : string) : Promise<boolean> {
    const body = await this.loadRaw(hash);
    return !!body;
  }

  async readRef(ref : string) : Promise<string | undefined> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    const result = await store.get(ref);
    return result ? result.hash as string : undefined;
  }

  async updateRef(ref : string, hash : string) : Promise<void> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    const entry = { path: ref, hash: hash };
    await store.put(entry);
  }
}