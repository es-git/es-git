import test from 'ava';
import * as sinon from 'sinon';
import { Type } from '@es-git/core';
import { IObjectRepo, GitObject, textToBlob } from '@es-git/object-mixin';

import loadAsMixin from './index';

test('load undefined', async t => {
  const load = sinon.stub();
  load.resolves(undefined);
  const objectRepo = new LoadAsRepo({load});
  await t.throws(objectRepo.loadBlob('blabla'));
});

test('load wrong type', async t => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: new Uint8Array(0)
  });
  const objectRepo = new LoadAsRepo({load});
  await t.throws(objectRepo.loadCommit('blabla'));
});

test('load expected type', async t => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: textToBlob('text')
  });
  const objectRepo = new LoadAsRepo({load});
  const result = await objectRepo.loadBlob('blabla');
  t.deepEqual(result, textToBlob('text'));
});

test('load text', async t => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: textToBlob('this is text')
  });
  const objectRepo = new LoadAsRepo({load});
  const result = await objectRepo.loadText('blabla');
  t.is(result, 'this is text');
});

const LoadAsRepo = loadAsMixin(class TestRepo implements IObjectRepo {
  private readonly load : sinon.SinonStub;
  constructor({load} : {load? : sinon.SinonStub} = {}){
    this.load = load || sinon.stub();
  }
  async loadObject(hash : string){
    return this.load(hash);
  }
  saveObject(object: GitObject): Promise<string> {
    throw new Error("Method not implemented.");
  }
});