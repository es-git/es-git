import test from 'ava';
import * as sinon from 'sinon';
import { IRawRepo, Type, Mode, Hash, encode } from '@es-git/core';
import { IObjectRepo, GitObject, CommitBody, TreeObject, TreeBody } from '@es-git/object-mixin';
import { IWalkersRepo, HashModePath, HashAndCommitObject } from '@es-git/walkers-mixin';

import checkoutMixin from './index';

test('checkout commit', async t => {
  const load = sinon.stub();
  const walkTreeStub = sinon.stub();
  const repo = new CheckoutRepo({load, walkTreeStub});
  load.withArgs('commitHash').resolves({type: Type.commit, body: makeCommit('commit')});
  walkTreeStub.withArgs('treeHash').returns(async function *() : AsyncIterableIterator<HashModePath>{
    yield {
      hash: 'file1Hash',
      mode: Mode.file,
      path: ['file.txt']
    };
  }());
  load.withArgs('file1Hash').resolves({type: Type.blob, body: encode('test')});

  const result = await repo.checkoutCommit('commitHash');
  if(!result) return t.fail();
  const file1 = result.files['file.txt'];
  if(!file1) return t.fail();
  t.is(file1.hash, 'file1Hash');
  t.is(file1.text, 'test');
  t.false(file1.isExecutable);
});

test('checkout subtree', async t => {
  const load = sinon.stub();
  const walkTreeStub = sinon.stub();
  const repo = new CheckoutRepo({load, walkTreeStub});
  load.withArgs('commitHash').resolves({type: Type.commit, body: makeCommit('commit')});
  walkTreeStub.withArgs('treeHash').returns(async function *() : AsyncIterableIterator<HashModePath>{
    yield {
      hash: 'folder1hash',
      mode: Mode.tree,
      path: ['folder']
    };
    yield {
      hash: 'file1Hash',
      mode: Mode.file,
      path: ['folder', 'file.txt']
    };
  }());
  load.withArgs('file1Hash').resolves({type: Type.blob, body: encode('test')});

  const result = await repo.checkoutCommit('commitHash');
  if(!result) return t.fail();
  t.is(result.folders['folder'].hash, 'folder1hash');
  const file1 = result.folders['folder'].files['file.txt'];
  if(!file1) return t.fail();
  t.is(file1.hash, 'file1Hash');
  t.is(file1.text, 'test');
  t.false(file1.isExecutable);
});

test('checkout branch', async t => {
  const load = sinon.stub();
  const walkTreeStub = sinon.stub();
  const getRefStub = sinon.stub();
  const repo = new CheckoutRepo({load, walkTreeStub, getRefStub});
  getRefStub.withArgs('branch').resolves('commitHash');
  load.withArgs('commitHash').resolves({type: Type.commit, body: makeCommit('commit')});
  walkTreeStub.withArgs('treeHash').returns(async function *() : AsyncIterableIterator<HashModePath>{
    yield {
      hash: 'file1Hash',
      mode: Mode.exec,
      path: ['file.txt']
    };
  }());
  load.withArgs('file1Hash').resolves({type: Type.blob, body: encode('test')});

  const result = await repo.checkout('branch');
  if(!result) return t.fail();
  const file1 = result.files['file.txt'];
  if(!file1) return t.fail();
  t.is(file1.text, 'test');
  t.true(file1.isExecutable);
});

const CheckoutRepo = checkoutMixin(class TestRepo implements IWalkersRepo, IObjectRepo, IRawRepo {
  private readonly load: sinon.SinonStub;
  private readonly walkTreeStub : sinon.SinonStub;
  private readonly getRefStub : sinon.SinonStub;
  constructor({load, walkTreeStub, getRefStub} : {load? : sinon.SinonStub, walkTreeStub? : sinon.SinonStub, getRefStub? : sinon.SinonStub} = {}){
    this.load = load || sinon.stub();
    this.walkTreeStub = walkTreeStub || sinon.stub();
    this.getRefStub = getRefStub || sinon.stub();
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

  listRefs(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  getRef(ref: string): Promise<string | undefined> {
    return this.getRefStub(ref);
  }
  setRef(ref: string, hash: string | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }
  saveRaw(hash: string, object: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }
  loadRaw(hash: string): Promise<Uint8Array | undefined> {
    throw new Error("Method not implemented.");
  }
  hasObject(hash: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  saveMetadata(name: string, value: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }
  loadMetadata(name: string): Promise<Uint8Array | undefined> {
    throw new Error("Method not implemented.");
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