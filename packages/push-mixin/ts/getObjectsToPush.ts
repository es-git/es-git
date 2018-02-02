import { IRawRepo } from '@es-git/core';
import { IWalkersRepo, withFeedback } from '@es-git/walkers-mixin';
import { Progress } from '@es-git/http-transport';

import findCommonCommits from './findCommonCommits';

export default async function getObjectsToPush(localHashes : string[], remoteHashes : string[], repo : IWalkersRepo & IRawRepo, progress : Progress){
  const localWalk = repo.walkCommits(...localHashes);
  const remoteWalk = repo.walkCommits(...remoteHashes)
  const commonCommits = await findCommonCommits(localWalk, remoteWalk);
  const remoteObjects = new Set<string>();
  for(const {hash, commit} of commonCommits){
    addToSet(hash, remoteObjects);
    if(addToSet(commit.tree, remoteObjects)) continue;
    const walkTree = withFeedback(repo.walkTree(commit.tree), true);
    for await(const {hash} of walkTree){
      if(addToSet(hash, remoteObjects)){
        walkTree.continue = false;
      }
    }
  }

  const localObjects = new Set<string>();
  const localCommits = withFeedback(repo.walkCommits(...localHashes), true);
  for await(const {hash, commit} of localCommits){
    if(addToSet(hash, localObjects, remoteObjects)) {
      localCommits.continue = false;
    } else {
      if(addToSet(commit.tree, localObjects, remoteObjects)) continue;
      progress(`Counting objects: ${localObjects.size}\r`);
      const walkTree = withFeedback(repo.walkTree(commit.tree), true);
      for await(const {hash} of walkTree){
        if(addToSet(hash, localObjects, remoteObjects)){
          walkTree.continue = false;
        }else{
          progress(`Counting objects: ${localObjects.size}\r`);
        }
      }
    }
  }

  progress(`Counting objects: ${localObjects.size}, done.\n`);

  return {
    count: localObjects.size,
    stream: read(localObjects.values(), hash => repo.loadRaw(hash))
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