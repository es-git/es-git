import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
import { Type, Mode, Hash } from '@es-git/core';
import { IObjectRepo, GitObject, CommitBody } from '@es-git/object-mixin';

import walkersMixin from './index';

sinonStubPromise(sinon);

test('walk', async t => {
  const load = sinon.stub();
  const repo = new WalkersRepo({load});
  load.withArgs('commit5').resolves({type: Type.commit, body: makeCommit('commit5', 'commit4')});
  load.withArgs('commit4').resolves({type: Type.commit, body: makeCommit('commit4', 'commit3')});
  load.withArgs('commit3').resolves({type: Type.commit, body: makeCommit('commit3', 'commit2')});
  load.withArgs('commit2').resolves({type: Type.commit, body: makeCommit('commit2', 'commit1')});
  load.withArgs('commit1').resolves({type: Type.commit, body: makeCommit('commit1', 'commit0')});
  load.withArgs('commit0').resolves({type: Type.commit, body: makeCommit('commit0')});
  let commit = 5;
  for await(const result of repo.walkCommits('commit5')){
    if(!result) return t.fail();
    t.is(result.hash, `commit${commit}`);
    t.is(result.commit.body.message, `commit${commit}`);
    commit--;
  }
  t.is(load.callCount, 6);
});

test('walk merge', async t => {
  const load = sinon.stub();
  const repo = new WalkersRepo({load});
  load.withArgs('commit5').resolves({type: Type.commit, body: makeCommit('commit5', 'commit4')});
  load.withArgs('commit4').resolves({type: Type.commit, body: makeCommit('commit4', 'commit3', 'commit2')});
  load.withArgs('commit3').resolves({type: Type.commit, body: makeCommit('commit3', 'commit1')});
  load.withArgs('commit2').resolves({type: Type.commit, body: makeCommit('commit2', 'commit1')});
  load.withArgs('commit1').resolves({type: Type.commit, body: makeCommit('commit1', 'commit0')});
  load.withArgs('commit0').resolves({type: Type.commit, body: makeCommit('commit0')});
  for await(const result of repo.walkCommits('commit5')){
    if(!result) return t.fail();
    t.is(result.hash, result.commit.body.message);
  }
  t.is(load.callCount, 6);
});

const WalkersRepo = walkersMixin(class TestRepo {
  private readonly load : sinon.SinonStub;
  constructor({load} : {load? : sinon.SinonStub} = {}){
    this.load = load || ((...args : any[]) => {});
  }
  async saveObject(object : GitObject){
    return 'dummy';
  }
  async loadObject(hash : string){
    return this.load(hash);
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