import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
import { IRawRepo, Type, Mode, Hash } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject, TreeBody, Person } from '@es-git/object-mixin';

import { TextEncoder } from 'text-encoding';

import commitMixin, {Folder} from './index';

sinonStubPromise(sinon);

test('commit', async t => {
  const saveObjectStub = sinon.stub();
  const setRefStub = sinon.stub();
  const getRefStub = sinon.stub();
  const repo = new CommitRepo({saveObjectStub, setRefStub, getRefStub});
  getRefStub.resolves('branchHash');
  saveObjectStub.resolves('dummyHash');
  setRefStub.resolves(undefined);

  const tree : Folder = {
    folders : {
      'folder1': {
        files: {
          'file1': {
            mode: Mode.file,
            text: 'file1Text'
          },
          'file2': {
            mode: Mode.file,
            hash: 'file2Hash'
          }
        }
      },
      'folder2': 'folder2Hash'
    }
  };

  const author : Person = {
    name: 'Marius Gundersen',
    email: 'me@mariusgundersen.net',
    date: {
      seconds: 1500841617,
      offset: -2*60
    }
  };

  const result = await repo.commit('refs/heads/master', tree, 'message', author);
  t.is(result, 'dummyHash');
  t.deepEqual<CommitObject>(saveObjectStub.lastCall.args[0], {
    type: Type.commit,
    body: {
      author,
      committer: author,
      message: 'message',
      parents: ['branchHash'],
      tree: 'dummyHash'
    }
  });
});

const CommitRepo = commitMixin(class TestRepo implements IObjectRepo, IRawRepo {
  private readonly saveObjectStub: sinon.SinonStub;
  private readonly setRefStub : sinon.SinonStub;
  private readonly getRefStub : sinon.SinonStub;
  constructor({saveObjectStub, setRefStub, getRefStub} : {saveObjectStub? : sinon.SinonStub, setRefStub? : sinon.SinonStub, getRefStub? : sinon.SinonStub} = {}){
    this.saveObjectStub = saveObjectStub || sinon.stub();
    this.setRefStub = setRefStub || sinon.stub();
    this.getRefStub = getRefStub || sinon.stub();
  }

  async saveObject(object : GitObject){
    return this.saveObjectStub(object);
  }

  loadObject(hash : string) : Promise<GitObject> {
    throw new Error("Method not implemented.");
  }

  listRefs(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  getRef(ref: string): Promise<string | undefined> {
    return this.getRefStub(ref);
  }
  async setRef(ref: string, hash: string): Promise<void> {
    this.setRefStub(ref, hash);
  }
  deleteRef(ref: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  saveRaw(hash: string, object: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }
  loadRaw(hash: string): Promise<Uint8Array | undefined> {
    throw new Error("Method not implemented.");
  }
});
