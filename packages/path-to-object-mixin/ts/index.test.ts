import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
import { Type, Mode } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

import pathToObjectMixin from './index';

sinonStubPromise(sinon);

test('load file', async t => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.onCall(0).resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.onCall(1).resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', 'file.txt');
  if(!result) return t.fail();
  t.is(result.type, Type.blob);
  t.true(load.calledTwice);
});

test('load deep file', async t => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', 'folder/file.txt');
  if(!result) return t.fail();
  t.is(result.type, Type.blob);
  t.true(load.calledThrice);
});

test('load deep file as array', async t => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'file.txt']);
  if(!result) return t.fail();
  t.is(result.type, Type.blob);
  t.true(load.calledThrice);
});

test('load deep unknown file', async t => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'doesNotExist.txt']);
  t.falsy(result);
  t.true(load.calledTwice);
});

test('load deep file where expected folder is actually file', async t => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.file, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'file.txt']);
  t.falsy(result);
  t.true(load.calledTwice);
});

const PathToObjectRepo = pathToObjectMixin(class TestRepo {
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