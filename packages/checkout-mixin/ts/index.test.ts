import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
import { Type, Mode, Hash } from '@es-git/core';
import { IObjectRepo, GitObject, CommitBody, TreeObject, TreeBody } from '@es-git/object-mixin';
import { IWalkersRepo, HashModePath, HashAndCommitObject } from '@es-git/walkers-mixin';

import { TextEncoder } from 'text-encoding';

import checkoutMixin from './index';

sinonStubPromise(sinon);

test('checkout', async t => {
  const load = sinon.stub();
  const walkTreeStub = sinon.stub();
  const repo = new CheckoutRepo({load, walkTreeStub});
  load.withArgs('commit').resolves({type: Type.commit, body: makeCommit('commit')});
  walkTreeStub.withArgs('treeHash').returns(async function *() : AsyncIterableIterator<HashModePath>{
    yield {
      hash: 'file1Hash',
      mode: Mode.file,
      path: ['file.txt']
    };
  }());
  load.withArgs('file1Hash').resolves({type: Type.blob, body: new TextEncoder().encode('test')});

  const result = await repo.checkout('commit');
  if(!result) return t.fail();
  if(result.isFile) return t.fail();
  const file1 = result.contents['file.txt'];
  if(!file1) return t.fail();
  if(file1.isFile === false) return t.fail();
  t.is(file1.text, 'test');
});

const CheckoutRepo = checkoutMixin(class TestRepo implements IWalkersRepo, IObjectRepo {
  private readonly load : sinon.SinonStub;
  private readonly walkTreeStub : sinon.SinonStub;
  constructor({load, walkTreeStub} : {load? : sinon.SinonStub, walkTreeStub? : sinon.SinonStub} = {}){
    this.load = load || sinon.stub();
    this.walkTreeStub = walkTreeStub || sinon.stub();
  }

  async saveObject(object : GitObject){
    return 'dummy';
  }

  async loadObject(hash : string){
    return this.load(hash);
  }

  async *walkCommits(hash : Hash) : AsyncIterableIterator<HashAndCommitObject> {
  }

  async *walkTree(hash : Hash) : AsyncIterableIterator<HashModePath> {
    yield* this.walkTreeStub(hash);
  }
});

function makeCommit(message : string, ...parents : Hash[]) : CommitBody{
  return {
    author: {
      name: 'author',
      email: 'author@website.com',
      date: new Date()
    },
    committer: {
      name: 'author',
      email: 'author@website.com',
      date: new Date()
    },
    tree: 'treeHash',
    message,
    parents
  };
}