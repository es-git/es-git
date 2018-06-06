import { Hash } from '@es-git/core';
import { withFeedback, HashAndCommitBody, HashModePath } from '@es-git/walkers-mixin';
import { Progress } from '@es-git/http-transport';

import findCommonCommits from './findCommonCommits';

export interface Funcs {
  loadRaw(hash: Hash): Promise<Uint8Array | undefined>;
  walkCommits(...hash: Hash[]): AsyncIterableIterator<HashAndCommitBody>;
  walkTree(hash: Hash): AsyncIterableIterator<HashModePath>;
  readonly progress : Progress
}

export default async function getObjectsToPush(localHashes : string[], remoteHashes : string[], funcs : Funcs){
  const localWalk = funcs.walkCommits(...localHashes);
  const remoteWalk = funcs.walkCommits(...remoteHashes)
  const commonCommits = await findCommonCommits(localWalk, remoteWalk);
  const remoteObjects = new Set<string>();
  for(const {hash, commit} of commonCommits){
    addToSet(hash, remoteObjects);
    if(addToSet(commit.tree, remoteObjects)) continue;
    const walkTree = withFeedback(funcs.walkTree(commit.tree), true);
    for await(const {hash} of walkTree){
      if(addToSet(hash, remoteObjects)){
        walkTree.continue = false;
      }
    }
  }

  const localObjects = new Set<string>();
  const localCommits = withFeedback(funcs.walkCommits(...localHashes), true);
  for await(const {hash, commit} of localCommits){
    if(addToSet(hash, localObjects, remoteObjects)) {
      localCommits.continue = false;
    } else {
      if(addToSet(commit.tree, localObjects, remoteObjects)) continue;
      funcs.progress(`Counting objects: ${localObjects.size}\r`);
      const walkTree = withFeedback(funcs.walkTree(commit.tree), true);
      for await(const {hash} of walkTree){
        if(addToSet(hash, localObjects, remoteObjects)){
          walkTree.continue = false;
        }else{
          funcs.progress(`Counting objects: ${localObjects.size}\r`);
        }
      }
    }
  }

  funcs.progress(`Counting objects: ${localObjects.size}, done.\n`);

  return {
    count: localObjects.size,
    stream: read(localObjects.values(), hash => funcs.loadRaw(hash))
  };
}

function addToSet(hash : string, include : Set<string>, exclude? : Set<string>) {
  if(include.has(hash) || exclude && exclude.has(hash)) return true;
  include.add(hash);
  return false;
}

async function* read(objects : IterableIterator<string>, loadRaw : (hash : string) => Promise<Uint8Array | undefined>) : AsyncIterableIterator<[string, Uint8Array]> {
  for(const hash of objects){
    const object = await loadRaw(hash);
    if(!object) throw new Error(`Could not load ${hash}`);
    yield [hash, object];
  }
}