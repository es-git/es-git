import { withFeedback } from '@es-git/walkers-mixin';


export interface HashAndCommit<T> {
  readonly hash : string
  readonly commit : T
}

export default async function getCommitsToPush<T>(localWalk : AsyncIterableIterator<HashAndCommit<T>>, ...remoteWalks : AsyncIterableIterator<HashAndCommit<T>>[]){
  const localCommits = new Map<string, HashAndCommit<T>>();
  const remoteCommits = new Map<string, HashAndCommit<T>>();
  const localWalker = withFeedback(localWalk, true);
  const remoteWalkers = withFeedback(zip(...remoteWalks), remoteWalks.map(n => true));
  let localFound = false;
  for await(const local of localWalker){
    localWalker.continue = true;
    const remotes = await remoteWalkers.next();
    if(!remotes.done){
      await walkRemotes(remotes.value, local);
    }
    if(local) {
      if(remoteCommits.has(local.hash)){
        localWalker.continue = false;
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
    remoteCommits: [...(remoteCommits.values())]
  };

  async function walkRemotes(remotes : (HashAndCommit<T> | undefined)[], local? : HashAndCommit<T>){
    for(let [remote, index] of remotes.map((v, i) => [v, i] as [HashAndCommit<T> | undefined, number])){
      remoteWalkers.continue[index] = true;
      if(remote && local && remote.hash === local.hash){
        localWalker.continue = false;
        remoteWalkers.continue[index] = false;
        remoteCommits.set(remote.hash, remote);
      }else if(remote){
        if(localCommits.has(remote.hash)){
          localCommits.delete(remote.hash);
          remoteCommits.set(remote.hash, remote);
          while(remote && (local ? local.hash !== remote.hash : true)){
            const next = await remoteWalks[index].next();
            remote = next.value;
            if(remote) {
              localCommits.delete(remote.hash);
              remoteCommits.set(remote.hash, remote);
            }
          }
          localWalker.continue = false;
          remoteWalkers.continue[index] = false;
        }
        if(remote) {
          remoteCommits.set(remote.hash, remote);
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