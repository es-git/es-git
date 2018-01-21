import test from 'ava';
import * as sinon from 'sinon';
import { Type, Mode, Hash } from '@es-git/core';
import { IObjectRepo, GitObject, CommitBody, TreeBody } from '@es-git/object-mixin';

import walkersMixin from './index';

test('walk commits', async t => {
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

test('walk merge commit', async t => {
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

test('walk tree', async t => {
  const load = sinon.stub();
  const repo = new WalkersRepo({load});
  const folder = makeFolder(
    'rootHash',
    '/file.txt',
    '/node_modules/folder/package.json',
    '/src/index.js',
    '/src/index.test.js'
  );
  load.callsFake(hash => ({type: Type.tree, body: folder[hash]}));
  const results = [];
  for await(const result of repo.walkTree('rootHash')){
    if(!result) return t.fail();
    results.push(result);
  }
  t.is(load.callCount, 4);
  t.deepEqual(results, [
    {
      hash: '/file.txt',
      mode: 33188,
      path: ['file.txt'],
    },
    {
      hash: '/node_modules',
      mode: 16384,
      path: ['node_modules'],
    },
    {
      hash: '/node_modules/folder',
      mode: 16384,
      path: ['node_modules', 'folder'],
    },
    {
      hash: '/node_modules/folder/package.json',
      mode: 33188,
      path: ['node_modules', 'folder', 'package.json'],
    },
    {
      hash: '/src',
      mode: 16384,
      path: ['src'],
    },
    {
      hash: '/src/index.js',
      mode: 33188,
      path: ['src', 'index.js'],
    },
    {
      hash: '/src/index.test.js',
      mode: 33188,
      path: ['src', 'index.test.js'],
    },
  ]);
});


test('list files', async t => {
  const load = sinon.stub();
  const repo = new WalkersRepo({load});
  const folder = makeFolder(
    'rootHash',
    '/file.txt',
    '/node_modules/folder/package.json',
    '/src/index.js',
    '/src/index.test.js'
  );
  load.callsFake(hash => ({type: Type.tree, body: folder[hash]}));
  const results = [];
  for await(const result of repo.listFiles('rootHash')){
    if(!result) return t.fail();
    results.push(result);
  }
  t.is(load.callCount, 4);
  t.deepEqual(results, [
    {
      hash: '/file.txt',
      mode: 33188,
      path: ['file.txt'],
    },
    {
      hash: '/node_modules/folder/package.json',
      mode: 33188,
      path: ['node_modules', 'folder', 'package.json'],
    },
    {
      hash: '/src/index.js',
      mode: 33188,
      path: ['src', 'index.js'],
    },
    {
      hash: '/src/index.test.js',
      mode: 33188,
      path: ['src', 'index.test.js'],
    },
  ]);
});

const WalkersRepo = walkersMixin(class TestRepo {
  private readonly load : sinon.SinonStub;
  constructor({load} : {load? : sinon.SinonStub} = {}){
    this.load = load || sinon.stub();
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

function makeFolder(hash : Hash, ...paths : string[]) : {[hash : string] : TreeBody} {
  const bodies : {[hash : string] : TreeBody} = {
    [hash]: {}
  };
  for(const path of paths){
    let subpath = '';
    let parent = bodies[hash];
    for(const segment of path.split('/').filter(x => x.length)){
      subpath += `/${segment}`;
      parent[segment] = {
        hash: subpath,
        mode: subpath === path ? Mode.file : Mode.tree
      };
      if(subpath !== path && subpath in bodies === false){
        bodies[subpath] = {};
      }
      parent = bodies[subpath];
    }
  }
  return bodies;
}