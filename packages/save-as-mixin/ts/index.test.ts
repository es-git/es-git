import * as sinon from 'sinon';
import { Type } from '@es-git/core';
import { IObjectRepo, GitObject, textToBlob } from '@es-git/object-mixin';

import saveAsMixin from './index';

test('save blob', async () => {
  const save = sinon.spy();
  const objectRepo = new SaveAsRepo({save});
  const blob = new Uint8Array(0);
  const result = await objectRepo.saveBlob(blob);
  expect(save.calledOnce).toBe(true);
  expect(save.args[0][0]).toEqual({
    type: Type.blob,
    body: blob
  });
});

test('save text', async () => {
  const save = sinon.spy();
  const objectRepo = new SaveAsRepo({save});
  const result = await objectRepo.saveText('hello');
  expect(save.calledOnce).toBe(true);
  expect(save.args[0][0]).toEqual({
    type: Type.blob,
    body: textToBlob('hello')
  });
});

const SaveAsRepo = saveAsMixin(class TestRepo implements IObjectRepo {
  private readonly save: sinon.SinonSpy;
  constructor({save} : {save? : sinon.SinonSpy} = {}){
    this.save = save || sinon.spy();
  }
  loadObject(hash: string): Promise<GitObject | undefined> {
    throw new Error("Method not implemented.");
  }
  async saveObject(object: GitObject): Promise<string> {
    return this.save(object);
  }
});