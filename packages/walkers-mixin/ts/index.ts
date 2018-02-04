import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject, CommitBody } from '@es-git/object-mixin';

export type HashAndCommitBody = {
  readonly hash : Hash
  readonly commit : CommitBody
}

export type HashModePath = {
  readonly hash : Hash
  readonly mode : Mode,
  readonly path : string[]
}

export interface IWalkersRepo {
  walkCommits(...hash : Hash[]) : AsyncIterableIterator<HashAndCommitBody>
  walkTree(hash : Hash) : AsyncIterableIterator<HashModePath>
  listFiles(hash : Hash) : AsyncIterableIterator<HashModePath>
}

export default function walkersMixin<T extends Constructor<IObjectRepo>>(repo : T) : Constructor<IWalkersRepo> & T {
  return class WalkersRepo extends repo implements IWalkersRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async *walkCommits(...hash : Hash[]) : AsyncIterableIterator<HashAndCommitBody> {
      const queue = hash;
      const visited = new Set<Hash>(queue);
      while(queue.length > 0){
        const hash = queue.shift();
        if(!hash) return;
        const commit = await super.loadObject(hash);
        if(!commit) throw new Error(`Could not find object ${hash}`);
        if(commit.type !== Type.commit) throw new Error(`Object is not a commit ${hash}`);
        const visitParents = yield {hash, commit: commit.body};
        if(visitParents === false) continue;
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
          if(isFile(mode)){
            yield {mode, hash, path};
          }else if((yield {mode, hash, path}) !== false){
            yield* this.walkTree(hash, path);
          }
        }
      }
    }

    async *listFiles(hash : Hash){
      for await(const entry of this.walkTree(hash)){
        if(isFile(entry.mode)) yield entry;
      }
    }
  }
}

export function withFeedback<TOut, TIn>(iterator : AsyncIterableIterator<TOut>, feedback : TIn) : AsyncIterableIterator<TOut> & { continue : TIn} {
  return {
    ...iterator,
    next() {
      const result = iterator.next(this.continue);
      this.continue = feedback;
      return result;
    },
    continue: feedback
  };
}