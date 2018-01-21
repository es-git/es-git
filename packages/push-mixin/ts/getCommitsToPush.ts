import { withFeedback } from '@es-git/walkers-mixin';


export interface HashAndCommit<T> {
  readonly hash : string
  readonly commit : T
}

export default async function getCommitsToPush<T>(localWalk : AsyncIterableIterator<HashAndCommit<T>>, remoteWalk : AsyncIterableIterator<HashAndCommit<T>>){
  const localCommits = new Map<string, HashAndCommit<T>>();
  const remoteCommits = new Map<string, HashAndCommit<T>>();
  const zippedWalker = withFeedback(zip(localWalk, remoteWalk), [true, true]);
  for await(let [local, remote] of zippedWalker){
    zippedWalker.feedback[0] = true;
    zippedWalker.feedback[1] = true;
    if(remote && local && remote.hash === local.hash){
      zippedWalker.feedback[0] = false;
      zippedWalker.feedback[1] = false;
    }else{
      if(remote){
        if(localCommits.has(remote.hash)){
          localCommits.delete(remote.hash);
          while(remote && (local ? local.hash !== remote.hash : true)){
            const next = await remoteWalk.next();
            remote = next.value;
            if(remote) {
              localCommits.delete(remote.hash);
            }
          }
          zippedWalker.feedback[0] = false;
          zippedWalker.feedback[1] = false;
          local = undefined;
        }else{
          remoteCommits.set(remote.hash, remote);
        }
      }
      if(local) {
        if(remoteCommits.has(local.hash)){
          zippedWalker.feedback[0] = false;
        }else{
          localCommits.set(local.hash, local);
        }
      }else{
        break;
      }
    }
  }
  return [...(localCommits.values())];
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