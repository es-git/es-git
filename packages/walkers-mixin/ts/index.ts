import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';

export type HashAndCommitObject = {
  readonly hash : Hash
  readonly commit : CommitObject
}

export type HashModePath = {
  readonly hash : Hash
  readonly mode : Mode,
  readonly path : string[]
}

export interface IWalkersRepo {
  walkCommits(hash : Hash) : AsyncIterableIterator<HashAndCommitObject>
  walkTree(hash : Hash) : AsyncIterableIterator<HashModePath>
}

export default function walkersMixin<T extends Constructor<IObjectRepo>>(repo : T) : Constructor<IWalkersRepo> & T {
  return class WalkersRepo extends repo implements WalkersRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async *walkCommits(hash : Hash) : AsyncIterableIterator<HashAndCommitObject> {
      const queue = [hash];
      const visited = new Set<Hash>(queue);
      while(queue.length > 0){
        const hash = queue.shift();
        if(!hash) return;
        const commit = await super.loadObject(hash);
        if(!commit) throw new Error(`Could not find object ${hash}`);
        if(commit.type !== Type.commit) throw new Error(`Object is not a commit ${hash}`);
        yield {hash, commit};
        for(const parent of commit.body.parents){
          if(visited.has(parent)) continue;
          visited.add(parent);
          queue.push(parent);
        }
      }
    }

    async *walkTree(hash : Hash, parentPath: string[] = []) : AsyncIterableIterator<HashModePath> {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Could not find object ${hash}`);
      if(object.type === Type.tree){
        for(const name of Object.keys(object.body)){
          const {mode, hash} = object.body[name];
          const path = [...parentPath, name];
          if(!isFile(mode)){
            yield* this.walkTree(hash, path);
          }else{
            yield {mode, hash, path};
          }
        }
      }
    }
  }
}