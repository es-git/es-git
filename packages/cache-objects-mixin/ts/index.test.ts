import test from 'ava';
import * as sinon from 'sinon';
import { Type } from '@es-git/core';
import { GitObject } from '@es-git/object-mixin';

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
  const load = sinon.spy();
  const objectRepo = new CacheObjectsRepo({}, {load});
  const result = await objectRepo.loadObject('object');
  t.true(load.calledOnce);
});

const CacheObjectsRepo = cacheObjectsMixin(class TestRepo {
  private readonly save : sinon.SinonSpy;
  private readonly load : sinon.SinonSpy;
  private readonly map : Map<string, GitObject>;
  constructor({save, load} : {save? : sinon.SinonSpy, load? : sinon.SinonSpy} = {}){
    this.save = save || sinon.spy();
    this.load = load || sinon.spy();
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