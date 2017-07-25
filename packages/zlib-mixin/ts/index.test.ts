import test from 'ava';

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

const CompressedRepo = zlibMixin(class {
  private readonly map : Map<string, Uint8Array>;
  constructor(){
    this.map = new Map<string, Uint8Array>();
  }
  async saveRaw(hash : string, object : Uint8Array){
    this.map.set(hash, object);
  }
  async loadRaw(hash : string){
    return this.map.get(hash);
  }
  async listRefs(){
    return [];
  }
  async getRef(ref : string){
    return undefined;
  }
  async setRef(ref : string, hash : string){
    return undefined;
  }
  async deleteRef(ref : string){
  }
});
