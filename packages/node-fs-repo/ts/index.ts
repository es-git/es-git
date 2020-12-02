import { Hash, IRawRepo } from '@es-git/core';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

export default class NodeFsRepo implements IRawRepo {
  readonly path: string
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
      await fs.writeFile(path, raw).catch(noAccess);
    }catch(e){
      await mkdirp(dirname(path));
      await fs.writeFile(path, raw).catch(noAccess);
    }
  }

  async loadRaw(hash : string) : Promise<Uint8Array | undefined> {
    return await fs.readFile(join(this.path, ...objectsPath(hash))).catch(notExists);
  }

  async listRefs() : Promise<Hash[]> {
    const queue = ['refs'];
    const refs = [];
    for(const path of queue){
      const absolutePath = join(this.path, path);
      const stat = await fs.stat(absolutePath);
      if(stat.isDirectory()){
        const files : string[] = await fs.readdir(absolutePath);
        queue.push(...files.map(file => join(path, file)));
      }else{
        refs.push(path);
      }
    }
    return refs;
  }

  async getRef(ref : string) : Promise<string | undefined> {
    const result : string | undefined = await fs.readFile(join(this.path, ref), 'utf8').catch(notExists);
    if(result) return result.trim();
  }

  async setRef(ref : string, hash : string | undefined) : Promise<void> {
    const path = join(this.path, ref);
    if(hash === undefined){
      await fs.unlink(join(this.path, ref)).catch(notExists);
    }else{
      try{
        await fs.writeFile(path, `${hash}\n`);
      }catch(e){
        await mkdirp(dirname(path));
        await fs.writeFile(path, `${hash}\n`);
      }
    }
  }

  async hasObject(hash: string): Promise<boolean> {
    const stat = await fs.stat(join(this.path, ...objectsPath(hash)));
    return stat.isFile();
  }

  async saveMetadata(name: string, value: Uint8Array | undefined): Promise<void> {
    const path = join(this.path, name);
    if(value){
      try{
        await fs.writeFile(path, value);
      }catch(e){
        await mkdirp(dirname(path));
        await fs.writeFile(path, value);
      }
    }else{
      await fs.unlink(path).catch(notExists);
    }
  }

  async loadMetadata(name: string): Promise<Uint8Array | undefined> {
    return await fs.readFile(join(this.path, name)).catch(notExists);
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