import test from 'ava';
import { Type } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

import cacheObjectsMixin from './index';

test('save and load', async t => {
  const objectRepo = new CacheObjectsRepo({});
  const object : GitObject = {
    type: Type.blob,
    body: new Uint8Array(100)
  };
  const hash = await objectRepo.saveObject(object);
  const result = await objectRepo.loadObject(hash);
  t.is(result, object);
});

test('second save returns value from cache', async t => {
  const objectRepo = new CacheObjectsRepo({});
  const object : GitObject = {
    type: Type.blob,
    body: new Uint8Array(100)
  };
  const hash1 = await objectRepo.saveObject(object);
  const hash2 = await objectRepo.saveObject(object);
  t.is(hash1, hash2);
});

test('load without save goes to source', async t => {
  const objectRepo = new CacheObjectsRepo({}, {load: () => t.pass()});
  const result = await objectRepo.loadObject('object');
});

const CacheObjectsRepo = cacheObjectsMixin(class TestRepo {
  private readonly save : callback;
  private readonly load : callback;
  private readonly map : Map<string, GitObject>;
  constructor({save, load} : {save? : callback, load? : callback} = {}){
    this.save = save || ((...args : any[]) => {});
    this.load = load || ((...args : any[]) => {});
    this.map = new Map<string, GitObject>();
  }
  async saveObject(object : GitObject){
    this.save(object);
    const hash = new Date().toISOString();
    this.map.set(hash, object);
    return hash;
  }
  async loadObject(hash : string){
    this.load(hash);
    return this.map.get(hash);
  }
});

type callback = (...args : any[]) => void;