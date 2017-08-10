import { promisify } from 'util';
import * as fsCallback from 'fs';
import { join, dirname } from 'path';
import { IRawRepo, Type, Hash } from '@es-git/core';

const fs = {
  writeFile: promisify(fsCallback.writeFile),
  readFile: promisify(fsCallback.readFile),
  exists: promisify(fsCallback.exists),
  readDir: promisify(fsCallback.readdir),
  unlink: promisify(fsCallback.unlink),
  stat: promisify(fsCallback.stat),
  mkdir: promisify(fsCallback.mkdir)
}

export default class NodeFsRepo implements IRawRepo {
  readonly path : string
  constructor(path : string) {
    this.path = path;
  }

  async init(){
    await mkdirp(join(this.path, 'branches'));
    await mkdirp(join(this.path, 'info'));
    await mkdirp(join(this.path, 'objects'));
    await mkdirp(join(this.path, 'refs'));
  }

  async saveRaw(hash : Hash, raw : Uint8Array) : Promise<void> {
    const path = join(this.path, ...objectsPath(hash));
    try{
      await fs.writeFile(path, raw);
    }catch(e){
      await fs.mkdir(dirname(path));
      await fs.writeFile(path, raw);
    }
  }

  async loadRaw(hash : string) : Promise<Uint8Array | undefined> {
    return await fs.readFile(join(this.path, ...objectsPath(hash))).catch(safely);
  }

  async listRefs() : Promise<Hash[]> {
    const queue = ['refs'];
    const refs = [];
    for(const path of queue){
      const absolutePath = join(this.path, path);
      const stat = await fs.stat(absolutePath);
      if(stat.isDirectory()){
        const files : string[] = await fs.readDir(absolutePath);
        queue.push(...files.map(file => join(path, file)));
      }else{
        refs.push(path);
      }
    }
    return refs;
  }

  async getRef(ref : string) : Promise<string | undefined> {
    const result : string | undefined = await fs.readFile(join(this.path, ref), 'utf8').catch(safely);
    if(result) return result.trim();
  }

  async setRef(ref : string, hash : string) : Promise<void> {
    const path = join(this.path, ref);
    try{
      await fs.writeFile(path, `${hash}\n`);
    }catch(e){
      await mkdirp(dirname(path));
      await fs.writeFile(path, `${hash}\n`);
    }
  }

  async deleteRef(ref : string) : Promise<void> {
    await fs.unlink(join(this.path, ref)).catch(safely);
  }
}

function objectsPath(hash : Hash){
  return [
    'objects',
    hash.substr(0, 2),
    hash.substr(2)
  ];
}

function safely(e : any){
  if(e.code === 'ENOENT'){
    return undefined;
  }else{
    throw e;
  }
}

async function mkdirp(p : string) {
  try{
    await fs.mkdir(p);
  }catch(er){
    if(er.code === 'ENOENT'){
      await mkdirp(dirname(p));
      await fs.mkdir(p);
    }else{
      const stat = await fs.stat(p);
      if (!stat.isDirectory()) throw er;
    }
  }
}