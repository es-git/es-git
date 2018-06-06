import { Type, Mode, Constructor, IRawRepo, Hash, isFile, decode } from '@es-git/core';
import { IObjectRepo } from '@es-git/object-mixin';
import { IWalkersRepo } from '@es-git/walkers-mixin';

export type Folder = {
  readonly hash : Hash
  readonly files : {
    readonly [key : string] : File;
  }
  readonly folders : {
    readonly [key : string] : Folder;
  }
}

type PartialFolder = {
  readonly hash : Hash
  readonly files : {
    [key : string] : File;
  }
  readonly folders : {
    [key : string] : Folder;
  }
}

export type File = {
  readonly hash : Hash
  readonly isExecutable : boolean,
  readonly body : Uint8Array,
  readonly text : string
}

export interface ICheckoutRepo {
  checkoutCommit(hash : Hash) : Promise<Folder>
  checkout(ref : string) : Promise<Folder>
}

export default function checkoutMixin<T extends Constructor<IWalkersRepo & IObjectRepo & IRawRepo>>(repo : T) : Constructor<ICheckoutRepo> & T {
  return class CheckoutRepo extends repo implements ICheckoutRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async checkoutCommit(hash : Hash) : Promise<Folder> {
      const commit = await super.loadObject(hash);
      if(!commit) throw new Error(`Cannot find object ${hash}`);
      if(commit.type !== Type.commit) throw new Error(`${hash} is not a commit`);
      const result : PartialFolder = {files: {}, folders: {}, hash: commit.body.tree};
      for await(const {path, mode, hash} of super.walkTree(commit.body.tree)){
        if(isFile(mode)){
          const file = await super.loadObject(hash);
          if(!file) throw new Error(`Cannot find object ${hash} for file ${path.join('/')}`);
          if(file.type !== Type.blob) throw new Error(`${hash} is not a blob for file ${path.join('/')}`);
          recursivelyMakeFile(result, path, mode === Mode.exec, hash, file.body);
        }else{
          recursivelyMakeFolder(result, path, hash);
        }
      }
      return result as Folder;
    }

    async checkout(ref : string) : Promise<Folder> {
      const hash = await super.getRef(ref);
      if(!hash) throw new Error(`Unknown ref ${ref}`);
      return this.checkoutCommit(hash);
    }
  }
}

function recursivelyMakeFile(parent : PartialFolder, path : string[], isExecutable : boolean, hash : Hash, body : Uint8Array){
  const [name, ...subPath] = path;
  if(subPath.length === 0){
    parent.files[name] = {
      hash,
      isExecutable,
      body,
      get text(){return decode(body)}
    }
  }else{
    recursivelyMakeFile(parent.folders[name], subPath, isExecutable, hash, body);
  }
}

function recursivelyMakeFolder(parent : PartialFolder, path : string[], hash : Hash){
  const [name, ...subPath] = path;
  if(subPath.length === 0){
    parent.folders[name] = {
      hash,
      files: {},
      folders: {}
    };
  }else{
    recursivelyMakeFolder(parent.folders[name], subPath, hash);
  }
}
