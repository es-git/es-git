import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
import { Type } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

import readCombinerMixin from './index';

sinonStubPromise(sinon);

test('load', async t => {
  const load = sinon.stub();
  const loadPromise = load.returnsPromise();
  const objectRepo = new ReadCombinerRepo({load});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const race = Promise.race([
    result1.then(x => false),
    result2.then(x => false),
    Promise.resolve(true)
  ]);
  loadPromise.resolves({type: Type.blob, body: new Uint8Array(0)});
  t.true(await race);
});

test('loadObject of super called only once', async t => {
  const load = sinon.stub();
  const loadPromise = load.returnsPromise();
  const objectRepo = new ReadCombinerRepo({load});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const result3 = objectRepo.loadObject('object');
  const result4 = objectRepo.loadObject('object');
  load.returns
  loadPromise.resolves({type: Type.blob, body: new Uint8Array(0)});
  t.true(load.calledOnce);
});

const ReadCombinerRepo = readCombinerMixin(class TestRepo {
  private readonly load : sinon.SinonStub;
  private readonly map : Map<string, GitObject>;
  constructor({load} : {load? : sinon.SinonStub} = {}){
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
