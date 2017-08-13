import test from 'ava';
import { IRawRepo } from '@es-git/core';

import zlibMixin from './index';

test('save and load tag', async t => {
  const compresedRepo = new CompressedRepo();
  const hash = '1234';
  const expected = 'testing some text';
  const object = Uint8Array.from(expected.split('').map(x => x.charCodeAt(0)));
  await compresedRepo.saveRaw(hash, object);
  const result = await compresedRepo.loadRaw(hash);
  if(result === undefined){
    t.fail('result is undefined');
    return
  }
  const actual = String.fromCharCode(...result);
  t.is(actual, expected);
});

const CompressedRepo = zlibMixin(class Repo implements IRawRepo {
  private readonly map: Map<string, Uint8Array>;
  constructor(){
    this.map = new Map<string, Uint8Array>();
  }
  async saveRaw(hash : string, object : Uint8Array){
    this.map.set(hash, object);
  }
  async loadRaw(hash : string){
    return this.map.get(hash);
  }
  listRefs(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  getRef(ref: string): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
  setRef(ref: string, hash: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  deleteRef(ref: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  hasObject(hash: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  saveMetadata(name: string, value: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }
  loadMetadata(name: string): Promise<Uint8Array | undefined> {
    throw new Error("Method not implemented.");
  }
});
