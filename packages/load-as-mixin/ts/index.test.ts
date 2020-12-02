import { Type } from '@es-git/core';
import { GitObject, IObjectRepo, textToBlob } from '@es-git/object-mixin';
import * as sinon from 'sinon';
import loadAsMixin from './index';


test('load undefined', async () => {
  const load = sinon.stub();
  load.resolves(undefined);
  const objectRepo = new LoadAsRepo({load});
  await expect(objectRepo.loadBlob('blabla')).rejects.toThrowError();
});

test('load wrong type', async () => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: new Uint8Array(0)
  });
  const objectRepo = new LoadAsRepo({load});
  await expect(objectRepo.loadCommit('blabla')).rejects.toThrowError();
});

test('load expected type', async () => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: textToBlob('text')
  });
  const objectRepo = new LoadAsRepo({load});
  const result = await objectRepo.loadBlob('blabla');
  expect(result).toEqual(textToBlob('text'));
});

test('load text', async () => {
  const load = sinon.stub();
  load.resolves({
    type: Type.blob,
    body: textToBlob('this is text')
  });
  const objectRepo = new LoadAsRepo({load});
  const result = await objectRepo.loadText('blabla');
  expect(result).toBe('this is text');
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