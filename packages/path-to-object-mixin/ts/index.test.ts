import { encode, Mode, Type } from '@es-git/core';
import { GitObject } from '@es-git/object-mixin';
import * as sinon from 'sinon';
import pathToObjectMixin from './index';


test('load file', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.onCall(0).resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.onCall(1).resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', 'file.txt');
  if(!result) fail();
  expect(result.type).toBe(Type.blob);
  expect(load.calledTwice).toBe(true);
});

test('load file as blob', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.onCall(0).resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.onCall(1).resolves({type: Type.blob, body: new Uint8Array([1, 2, 3])});
  const result = await repo.loadBlobByPath('rootHash', 'file.txt');
  if(!result) fail();
  expect(result).toEqual(new Uint8Array([1,2,3]));
});

test('load file as string', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.onCall(0).resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.onCall(1).resolves({type: Type.blob, body: encode('test')});
  const result = await repo.loadTextByPath('rootHash', 'file.txt');
  if(!result) fail();
  expect(result).toBe('test');
});

test('load deep file', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', 'folder/file.txt');
  if(!result) fail();
  expect(result.type).toBe(Type.blob);
  expect(load.calledThrice).toBe(true);
});

test('load deep file as array', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'file.txt']);
  if(!result) fail();
  expect(result.type).toBe(Type.blob);
  expect(load.calledThrice).toBe(true);
});

test('load deep unknown file', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.tree, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.tree, body: {'file.txt' : {mode: Mode.file, hash: 'fileHash'}}});
  load.withArgs('fileHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'doesNotExist.txt']);
  expect(result).toBeFalsy();
  expect(load.calledTwice).toBe(true);
});

test('load deep file where expected folder is actually file', async () => {
  const load = sinon.stub();
  const repo = new PathToObjectRepo({load});
  load.withArgs('rootHash').resolves({type: Type.tree, body: {'folder' : {mode: Mode.file, hash: 'folderHash'}}});
  load.withArgs('folderHash').resolves({type: Type.blob, body: new Uint8Array(0)});
  const result = await repo.loadObjectByPath('rootHash', ['folder', 'file.txt']);
  expect(result).toBeFalsy();
  expect(load.calledTwice).toBe(true);
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