import test from 'ava';
import { Type } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

import readCombinerMixin from './index';

test('load', async t => {
  let resolveLoadObject : (value? : GitObject) => void = () => false as never;
  const loadResult = new Promise(res => resolveLoadObject = res);
  const objectRepo = new ReadCombinerRepo({load: () => loadResult});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const race = Promise.race([
    result1.then(x => false),
    result2.then(x => false),
    loadResult.then(x => true)
  ]);
  resolveLoadObject({type: Type.blob, body: new Uint8Array(0)});
  t.true(await race);
});

test('loadObject of super called only once', async t => {
  let resolveLoadObject : (value? : GitObject) => void = () => false as never;
  const loadResult = new Promise(res => resolveLoadObject = res);
  let loadCalls = 0;
  const objectRepo = new ReadCombinerRepo({load: () => {loadCalls++; return loadResult}});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const result3 = objectRepo.loadObject('object');
  const result4 = objectRepo.loadObject('object');
  resolveLoadObject({type: Type.blob, body: new Uint8Array(0)});
  t.is(loadCalls, 1);
});

const ReadCombinerRepo = readCombinerMixin(class TestRepo {
  private readonly load : callback;
  private readonly map : Map<string, GitObject>;
  constructor({load} : {load? : callback} = {}){
    this.load = load || ((...args : any[]) => {});
    this.map = new Map<string, GitObject>();
  }
  async saveObject(object : GitObject){
    const hash = new Date().toISOString();
    this.map.set(hash, object);
    return hash;
  }
  async loadObject(hash : string){
    return this.load(hash);
  }
});

type callback = (...args : any[]) => any;