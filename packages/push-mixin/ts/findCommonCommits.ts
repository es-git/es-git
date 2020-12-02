import { withFeedback } from '@es-git/walkers-mixin';

export interface CommitWithParents {
  readonly parents : string[]
}

export interface HashAndCommit<T extends CommitWithParents> {
  readonly hash : string
  readonly commit : T
}

export default async function findCommonCommits<T extends CommitWithParents>(localWalk : AsyncGenerator<HashAndCommit<T>>, remoteWalk : AsyncGenerator<HashAndCommit<T>>){
  const localCommits = new Map<string, HashAndCommit<T>>();
  const commonCommits = new Map<string, HashAndCommit<T>>();
  const remoteCommits = new Set<string>();
  const localWalker = withFeedback(localWalk, true);
  const remoteWalker = withFeedback(remoteWalk, true);
  let loopEndedBeforeAllLocalsWereFound = false;
  for await(const local of localWalker){
    loopEndedBeforeAllLocalsWereFound = true;

    if(localCommits.has(local.hash)){
      localWalker.continue = false;
      continue;
    }

    const remote = await remoteWalker.next();
    if(!remote.done){
      if(remoteCommits.has(remote.value.hash)){
        remoteWalker.continue = false;
      }else if(await walkRemotes(remote.value, local)){
        loopEndedBeforeAllLocalsWereFound = false;
        localWalker.continue = false;
        remoteWalker.continue = false;
        continue;
      }
    }

    localCommits.set(local.hash, local);
    if(remoteCommits.has(local.hash)){
      commonCommits.set(local.hash, local);
      loopEndedBeforeAllLocalsWereFound = false;
      localWalker.continue = false;
    }
  }

  if(loopEndedBeforeAllLocalsWereFound){
    for await(const remote of remoteWalker){
      if(await walkRemotes(remote)){
        remoteWalker.continue = false;
      }
    }
  }

  return [...(commonCommits.values())];

  async function walkRemotes(remote : HashAndCommit<T>, local? : HashAndCommit<T>){
    remoteCommits.add(remote.hash);

    if(local && local.hash === remote.hash){
      commonCommits.set(local.hash, local);
      return true;
    }

    if(localCommits.has(remote.hash)){
      commonCommits.set(remote.hash, remote);
      for(const common of walkLocals(remote.hash)){
        remoteCommits.add(remote.hash);
      }

      return true;
    }

    return false;
  }

  function* walkLocals(...queue : string[]){
    for(const hash of queue){
      const commit = localCommits.get(hash);
      if(commit && (yield commit) !== false){
        queue.push(...commit.commit.parents);
      }
    }
  }
}