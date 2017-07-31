import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, HashModePath } from '@es-git/walkers-mixin';

import { TextDecoder } from 'text-encoding';

export type Folder = {
  readonly hash : Hash
  readonly files : {
    readonly [key : string] : File;
  }
  readonly folders : {
    readonly [key : string] : Folder;
  }
}

export type File = {
  readonly hash : Hash
  readonly mode : number,
  readonly body : Uint8Array,
  readonly text : string
}

export interface ICheckoutRepo {
  checkoutCommit(hash : Hash) : Promise<Folder>
  checkout(ref : string) : Promise<Folder>
}

const decoder = new TextDecoder();

export default function checkoutMixin<T extends Constructor<IWalkersRepo & IObjectRepo & IRawRepo>>(repo : T) : Constructor<ICheckoutRepo> & T {
  return class CheckoutRepo extends repo implements ICheckoutRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async checkoutCommit(hash : Hash) : Promise<Folder> {
      const result = {files: {}, folders: {}, hash};
      const commit = await super.loadObject(hash);
      if(!commit) throw new Error(`Cannot find object ${hash}`);
      if(commit.type !== Type.commit) throw new Error(`${hash} is not a commit`);
      for await(const {path, mode, hash} of super.walkTree(commit.body.tree, true)){
        if(isFile(mode)){
          const file = await super.loadObject(hash);
          if(!file) throw new Error(`Cannot find object ${hash} for file ${path.join('/')}`);
          if(file.type !== Type.blob) throw new Error(`${hash} is not a blob for file ${path.join('/')}`);
          recursivelyMakeFile(result, path, mode, hash, file.body);
        }else{
          recursivelyMakeFolder(result, path, mode, hash);
        }
      }
      return result;
    }

    async checkout(ref : string) : Promise<Folder> {
      const hash = await super.getRef(ref);
      if(!hash) throw new Error(`Unknown ref ${ref}`);
      return this.checkoutCommit(hash);
    }
  }
}

function recursivelyMakeFile(parent : any, path : string[], mode : Mode, hash : Hash, body : Uint8Array){
  const [name, ...subPath] = path;
  if(subPath.length === 0){
    parent.files[name] = {
      hash,
      mode,
      body,
      get text(){return decoder.decode(body)}
    }
  }else{
    recursivelyMakeFile(parent.folders[name], subPath, mode, hash, body);
  }
}

function recursivelyMakeFolder(parent : any, path : string[], mode : Mode, hash : Hash){
  const [name, ...subPath] = path;
  if(subPath.length === 0){
    parent.folders[name] = {
      hash,
      files: {},
      folders: {}
    };
  }else{
    recursivelyMakeFolder(parent.folders[name], subPath, mode, hash);
  }
}