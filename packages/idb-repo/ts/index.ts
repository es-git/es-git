import idb, { DB } from 'idb';

import { IRawRepo, Type, Hash } from '@es-git/core';

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

  async saveRaw(hash : Hash, raw : Uint8Array) : Promise<void> {
    const trans = this.db.transaction(["objects"], "readwrite");
    const store = trans.objectStore("objects");
    await store.put({hash, raw});
  }

  async loadRaw(hash : Hash) : Promise<Uint8Array | undefined> {
    const trans = this.db.transaction(["objects"], "readwrite");
    const store = trans.objectStore("objects");
    const result = await store.get(hash);
    return result ? result.raw as Uint8Array : undefined;
  }

  async listRefs() : Promise<Hash[]> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    return await store.getAllKeys() as Hash[];
  }

  async getRef(ref : string) : Promise<Hash | undefined> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    const result = await store.get(ref);
    return result ? result.hash as Hash : undefined;
  }

  async setRef(ref : string, hash : Hash) : Promise<void> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    const entry = { path: ref, hash: hash };
    await store.put(entry);
  }

  async deleteRef(ref : string) : Promise<void> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    await store.delete(ref);
  }
}