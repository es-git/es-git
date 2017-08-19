import idb, { DB } from 'idb';

import { IRawRepo, Type, Hash } from '@es-git/core';

export { DB };

export async function init(name='.git') : Promise<DB> {
  const database = await idb.open(name, 1, db => {
    db.createObjectStore("objects", {keyPath: "hash"});
    db.createObjectStore("refs", {keyPath: "path"});
    db.createObjectStore("metadata", {keyPath: "name"});
  });

  return database;
}

export default class IdbRepo implements IRawRepo {
  private readonly db: DB
  constructor(db : DB) {
    this.db = db;
  }

  async saveRaw(hash : Hash, raw : Uint8Array) : Promise<void> {
    const trans = this.db.transaction(["objects"], "readwrite");
    const store = trans.objectStore("objects");
    await store.put({hash, raw});
  }

  async loadRaw(hash : Hash) : Promise<Uint8Array | undefined> {
    const trans = this.db.transaction(["objects"], "readonly");
    const store = trans.objectStore("objects");
    const result = await store.get(hash).catch(N => undefined);
    return result ? result.raw as Uint8Array : undefined;
  }

  async listRefs() : Promise<Hash[]> {
    const trans = this.db.transaction(["refs"], "readonly");
    const store = trans.objectStore("refs");
    return await store.getAllKeys() as Hash[];
  }

  async getRef(ref : string) : Promise<Hash | undefined> {
    const trans = this.db.transaction(["refs"], "readonly");
    const store = trans.objectStore("refs");
    const result = await store.get(ref).catch(N => undefined);
    return result ? result.hash as Hash : undefined;
  }

  async setRef(ref : string, hash : Hash | undefined) : Promise<void> {
    const trans = this.db.transaction(["refs"], "readwrite");
    const store = trans.objectStore("refs");
    if(hash === undefined){
      await store.delete(ref);
    }else{
      const entry = { path: ref, hash: hash };
      await store.put(entry);
    }
  }

  async hasObject(hash: string): Promise<boolean> {
    const trans = this.db.transaction(["objects"], "readonly");
    const store = trans.objectStore("objects");
    return await store.getKey(hash).then(Y => true, N => false);
  }

  async saveMetadata(name: string, value: Uint8Array | undefined): Promise<void> {
    const trans = this.db.transaction(["metadata"], "readwrite");
    const store = trans.objectStore("metadata");
    if(value){
      await store.put({name, value});
    }else{
      await store.delete(name);
    }
  }

  async loadMetadata(name: string): Promise<Uint8Array | undefined> {
    const trans = this.db.transaction(["metadata"], "readonly");
    const store = trans.objectStore("metadata");
    const result = await store.get(name).catch(N => undefined);
    return result ? result.value as Uint8Array : undefined;
  }
}