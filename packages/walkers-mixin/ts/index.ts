import { Type, Mode, Constructor, IRawRepo, Hash } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject } from '@es-git/object-mixin';

export type HashAndCommitObject = {
  readonly hash : Hash
  readonly commit : CommitObject
}

export interface IWalkersRepo {
  walkCommits(hash : Hash) : AsyncIterableIterator<HashAndCommitObject>
}

export default function walkersMixin<T extends Constructor<IObjectRepo>>(repo : T) : Constructor<IWalkersRepo> & T {
  return class WalkersRepo extends repo implements WalkersRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async *walkCommits(hash : Hash) : AsyncIterableIterator<HashAndCommitObject> {
      let queue = [hash];
      let visited = new Set<Hash>(queue);
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
  }
}