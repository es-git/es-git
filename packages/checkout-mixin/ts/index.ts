import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, HashModePath } from '@es-git/walkers-mixin';

import { TextDecoder } from 'text-encoding';

export type Folder = {
  readonly isFile : false
  readonly contents : {
    readonly [key : string] : Folder | File;
  }
}

export type File = {
  readonly isFile : true
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
      const result = {contents: {}, isFile: false as false};
      const commit = await super.loadObject(hash);
      if(!commit) throw new Error(`Cannot find object ${hash}`);
      if(commit.type !== Type.commit) throw new Error(`${hash} is not a commit`);
      for await(const {path, mode, hash} of super.walkTree(commit.body.tree)){
        const file = await super.loadObject(hash);
        if(!file) throw new Error(`Cannot find object ${hash} for file ${path.join('/')}`);
        if(file.type !== Type.blob) throw new Error(`${hash} is not a blob for file ${path.join('/')}`);
        recursivelyMake(result, path, mode, file.body);
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

function recursivelyMake(folder : any, path : string[], mode : Mode, body : Uint8Array){
  const [name, ...subPath] = path;
  if(subPath.length === 0){
    folder.contents[name] = {
      mode,
      body,
      get text(){return decoder.decode(body)}
    }
  }else{
    if(name in folder === false){
      folder.contents[name] = {contents: {}};
    }
    recursivelyMake(folder.contents[name], subPath, mode, body);
  }
}