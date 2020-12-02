import * as sinon from 'sinon';
import { Type } from '@es-git/core';
import { GitObject } from '@es-git/object-mixin';

import readCombinerMixin from './index';

test('load', async () => {
  const load = sinon.stub();
  const {promise, resolve} = defer();
  load.returns(promise);
  const objectRepo = new ReadCombinerRepo({load});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const race = Promise.race([
    result1.then(x => false),
    result2.then(x => false),
    Promise.resolve(true)
  ]);
  resolve({type: Type.blob, body: new Uint8Array(0)});
  expect(await race).toBe(true);
});

test('loadObject of super called only once', async () => {
  const load = sinon.stub();
  const {promise, resolve} = defer();
  load.returns(promise);
  const objectRepo = new ReadCombinerRepo({load});
  const result1 = objectRepo.loadObject('object');
  const result2 = objectRepo.loadObject('object');
  const result3 = objectRepo.loadObject('object');
  const result4 = objectRepo.loadObject('object');
  resolve({type: Type.blob, body: new Uint8Array(0)});
  expect(load.calledOnce).toBe(true);
});

const ReadCombinerRepo = readCombinerMixin(class TestRepo {
  private readonly load : sinon.SinonStub;
  private readonly map : Map<string, GitObject>;
  constructor({load} : {load? : sinon.SinonStub} = {}){
    this.load = load || sinon.stub();
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

function defer(){
  let resolve = (v? : any) => {};
  let reject = (e? : any) => {};
  return {
    promise: new Promise((res, rej) => {resolve = res, reject = res}),
    resolve,
    reject
  }
}