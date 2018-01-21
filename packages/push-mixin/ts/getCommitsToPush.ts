
export interface HashAndCommit<T> {
  readonly hash : string
  readonly commit : T
}

export default async function getCommitsToPush<T>(localWalk : AsyncIterableIterator<HashAndCommit<T>>, remoteWalk : AsyncIterableIterator<HashAndCommit<T>>){
  const localCommits = new Map<string, HashAndCommit<T>>();
  const remoteCommits = new Map<string, HashAndCommit<T>>();
  for await(let [local, remote] of zip(localWalk, remoteWalk)){
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
        break;
      }
      remoteCommits.set(remote.hash, remote);
    }
    if(local) {
      if(remoteCommits.has(local.hash)) break;
      localCommits.set(local.hash, local);
    }
  }
  return [...(localCommits.values())];
}

export async function* zip<T>(...iterators : AsyncIterableIterator<T>[]) : AsyncIterableIterator<(T | undefined)[]>{
  let allDone = false
  try{
    while(!allDone){
      const next = await Promise.all(iterators.map(i => i.next()));
      allDone = next.every(n => n.done);
      if(!allDone) yield next.map(n => n.value);
    }
  }finally{
    iterators.forEach(i => i.return && i.return());
  }
}