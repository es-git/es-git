import { withFeedback } from '@es-git/walkers-mixin';


export interface HashAndCommit<T> {
  readonly hash : string
  readonly commit : T
}

export default async function getCommitsToPush<T>(localWalk : AsyncIterableIterator<HashAndCommit<T>>, ...remoteWalks : AsyncIterableIterator<HashAndCommit<T>>[]){
  const localCommits = new Map<string, HashAndCommit<T>>();
  const commonCommits = new Map<string, HashAndCommit<T>>();
  const remoteCommits = new Set<string>();
  const localWalker = withFeedback(localWalk, true);
  const remoteWalkers = withFeedback(zip(...remoteWalks), remoteWalks.map(n => true));
  let localFound = false;
  for await(const local of localWalker){
    localFound = false;
    localWalker.continue = true;
    const remotes = await remoteWalkers.next();
    if(!remotes.done){
      await walkRemotes(remotes.value, local);
    }
    if(local && !localFound) {
      if(remoteCommits.has(local.hash)){
        localWalker.continue = false;
        commonCommits.set(local.hash, local);
        localFound = true;
      }else{
        localCommits.set(local.hash, local);
      }
    }
  }
  if(!localFound){
    for await(const remotes of remoteWalkers){
      await walkRemotes(remotes);
    }
  }
  return {
    localCommits: [...(localCommits.values())],
    commonCommits: [...(commonCommits.values())]
  };

  async function walkRemotes(remotes : (HashAndCommit<T> | undefined)[], local? : HashAndCommit<T>){
    for(let [remote, index] of remotes.map((v, i) => [v, i] as [HashAndCommit<T> | undefined, number])){
      remoteWalkers.continue[index] = true;
      if(remote && local && remote.hash === local.hash){
        localWalker.continue = false;
        remoteWalkers.continue[index] = false;
        remoteCommits.add(remote.hash);
        commonCommits.set(remote.hash, remote);
        localFound = true;
      }else if(remote){
        if(localCommits.has(remote.hash)){
          localCommits.delete(remote.hash);
          remoteCommits.add(remote.hash);
          localFound = true;
          commonCommits.set(remote.hash, remote);
          while(remote && (local ? local.hash !== remote.hash : true)){
            const next = await remoteWalks[index].next();
            remote = next.value;
            if(remote) {
              localCommits.delete(remote.hash);
              remoteCommits.add(remote.hash);
            }
          }
          localWalker.continue = false;
          remoteWalkers.continue[index] = false;
        }
        if(remote) {
          remoteCommits.add(remote.hash);
        }
      }
    }
  }
}

export async function* zip<T>(...iterators : AsyncIterableIterator<T>[]) : AsyncIterableIterator<(T | undefined)[]>{
  let feedback : any[] = [];
  try{
    while(true){
      const next = await Promise.all(iterators.map((e, i) => e.next(feedback && feedback[i])));
      if(next.every(n => n.done)){
        return;
      } else {
        feedback = yield next.map(n => n.value);
      }
    }
  }finally{
    iterators.forEach(i => i.return && i.return());
  }
}