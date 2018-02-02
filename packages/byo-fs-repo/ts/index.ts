import { promisify } from 'util';
import * as fsCallback from 'fs';
import { join, dirname } from 'path';
import { IRawRepo, Type, Hash } from '@es-git/core';

export interface IRepoFileSystem {
  writeFile(path : string, contents : any): Promise<any>
  readFile(path : string, encoding? : any): Promise<any>
  exists(path : string): Promise<any>
  readDir(path : string): Promise<any>
  unlink(path : string): Promise<any>
  stat(path : string): Promise<any>
  mkdir(path : string): Promise<any>
}

export default class ByoFsRepo implements IRawRepo {
  readonly fs: IRepoFileSystem
  readonly path: string
  constructor(fs: IRepoFileSystem, path : string) {
    this.fs = fs;
    this.path = path;
  }

  async init(){
    await this.mkdirp(join(this.path, 'branches'));
    await this.mkdirp(join(this.path, 'info'));
    await this.mkdirp(join(this.path, 'objects'));
    await this.mkdirp(join(this.path, 'refs'));
  }

  async saveRaw(hash : Hash, raw : Uint8Array) : Promise<void> {
    const path = join(this.path, ...objectsPath(hash));
    try{
      await this.fs.writeFile(path, raw).catch(noAccess);
    }catch(e){
      await this.mkdirp(dirname(path));
      await this.fs.writeFile(path, raw).catch(noAccess);
    }
  }

  async loadRaw(hash : string) : Promise<Uint8Array | undefined> {
    return await this.fs.readFile(join(this.path, ...objectsPath(hash))).catch(notExists);
  }

  async listRefs() : Promise<Hash[]> {
    const queue = ['refs'];
    const refs = [];
    for(const path of queue){
      const absolutePath = join(this.path, path);
      const stat = await this.fs.stat(absolutePath);
      if(stat.isDirectory()){
        const files : string[] = await this.fs.readDir(absolutePath);
        queue.push(...files.map(file => join(path, file)));
      }else{
        refs.push(path);
      }
    }
    return refs;
  }

  async getRef(ref : string) : Promise<string | undefined> {
    const result : string | undefined = await this.fs.readFile(join(this.path, ref), 'utf8').catch(notExists);
    if(result) return result.trim();
  }

  async setRef(ref : string, hash : string | undefined) : Promise<void> {
    const path = join(this.path, ref);
    if(hash === undefined){
      await this.fs.unlink(join(this.path, ref)).catch(notExists);
    }else{
      try{
        await this.fs.writeFile(path, `${hash}\n`);
      }catch(e){
        await this.mkdirp(dirname(path));
        await this.fs.writeFile(path, `${hash}\n`);
      }
    }
  }

  async hasObject(hash: string): Promise<boolean> {
    const stat = await this.fs.stat(join(this.path, ...objectsPath(hash)));
    return stat.isFile();
  }

  async saveMetadata(name: string, value: Uint8Array | undefined): Promise<void> {
    const path = join(this.path, name);
    if(value){
      try{
        await this.fs.writeFile(path, value);
      }catch(e){
        await this.mkdirp(dirname(path));
        await this.fs.writeFile(path, value);
      }
    }else{
      await this.fs.unlink(path).catch(notExists);
    }
  }

  async loadMetadata(name: string): Promise<Uint8Array | undefined> {
    return await this.fs.readFile(join(this.path, name)).catch(notExists);
  }

  private async mkdirp(p : string) {
    try{
      await this.fs.mkdir(p);
    }catch(er){
      if(er.code === 'ENOENT'){
        await this.mkdirp(dirname(p));
        await this.fs.mkdir(p);
      }else{
        const stat = await this.fs.stat(p);
        if (!stat.isDirectory()) throw er;
      }
    }
  }
}

function objectsPath(hash : Hash){
  return [
    'objects',
    hash.substr(0, 2),
    hash.substr(2)
  ];
}

function notExists(e : any){
  if(e.code === 'ENOENT'){
    return undefined;
  }else{
    throw e;
  }
}

function noAccess(e : any){
  if(e.code === 'EACCES'){
    return;
  }else{
    throw e;
  }
}
