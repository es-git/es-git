import { Type, Mode, Constructor, IRawRepo, Hash, isFile, encode } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject, BlobObject, Person, ModeHash } from '@es-git/object-mixin';

export type Folder = {
  readonly files? : {
    readonly [key : string] : File | TextFile | ExistingFile;
  }
  readonly folders? : {
    readonly [key : string] : Folder | Hash;
  }
}

export type File = {
  readonly isExecutable? : boolean
  readonly body : Uint8Array
}

export type TextFile = {
  readonly isExecutable? : boolean
  readonly text : string
}

export type ExistingFile = {
  readonly isExecutable? : boolean
  readonly hash : Hash
}

export { Hash };

export interface ICommitRepo {
  commit(ref : string, tree : Folder, message : string, author : Person, committer? : Person) : Promise<Hash>
  saveTree(folder : Folder | Hash) : Promise<Hash>
}

export default function commitMixin<T extends Constructor<IObjectRepo & IRawRepo>>(repo : T) : Constructor<ICommitRepo> & T {
  return class CommitRepo extends repo implements ICommitRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async commit(ref : string, tree : Folder, message : string, author : Person, committer = author) : Promise<Hash> {
      const originalHash = await super.getRef(ref);
      if(!originalHash) throw new Error(`Unknown ref ${ref}`);

      const treeHash = await this.saveTree(tree);

      const hash = await super.saveObject({
        type: Type.commit,
        body:{
          author,
          committer,
          message,
          parents: [originalHash],
          tree: treeHash
        }
      });

      await super.setRef(ref, hash);
      return hash;
    }

    async saveTree(folder : Folder | Hash) : Promise<Hash> {
      if(typeof(folder) === 'string') return folder;

      const body : {[key : string] : ModeHash} = {};

      if(folder.folders){
        for(const name of Object.keys(folder.folders)){
          const hash = await this.saveTree(folder.folders[name]);
          body[name] = {hash, mode: Mode.tree};
        }
      }

      if(folder.files){
        for(const name of Object.keys(folder.files)){
          const hash = await this.saveFile(folder.files[name]);
          body[name] = {hash, mode: folder.files[name].isExecutable ? Mode.exec : Mode.file};
        }
      }

      return await super.saveObject({
        type: Type.tree,
        body: body
      });
    }

    async saveFile(file : File | TextFile | ExistingFile) : Promise<Hash>{
      if(isHash(file)) return file.hash;

      if(isText(file))
        return await super.saveObject({type: Type.blob, body: encode(file.text)});
      else
        return await super.saveObject({type: Type.blob, body: file.body});
    }
  }
}

function isHash(file : File | TextFile | ExistingFile) : file is ExistingFile {
  return 'hash' in file;
}

function isText(file : File | TextFile) : file is TextFile {
  return 'text' in file;
}