import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, HashAndCommitObject } from '@es-git/walkers-mixin';
import { lsRemote, push, Fetch, Command, Auth } from '@es-git/http-transport';

export { Fetch, Auth };

export interface IPushRepo {
  push(url : string, ref : string, auth? : Auth) : Promise<string>
}

export default function pushMixin<T extends Constructor<IObjectRepo & IWalkersRepo & IRawRepo>>(repo : T, fetch : Fetch) : Constructor<IPushRepo> & T {
  return class PushRepo extends repo implements IPushRepo {
    async push(url : string, ref : string, auth? : Auth) : Promise<string> {
      const hash = await super.getRef(ref);
      if(!hash) throw new Error(`Unknown ref ${ref}`);

      const {remoteRefs, capabilities} = await lsRemote(url, fetch);
      const remoteRef = remoteRefs.filter(r => r.name === ref)[0] || {hash:'00', name: ref};
      if(remoteRef.hash === hash) return '';
      const command : Command = remoteRef.hash == '00'
        ? {
          type: 'create',
          ref,
          hash
        } : {
          type: 'update',
          ref,
          oldHash: remoteRef.hash,
          newHash: hash
        };
      const remoteHashes = await Promise.all(remoteRefs.map(async r => ({hash:r.hash, known: await super.hasObject(r.hash)})))
        .then(a => a.filter(x => x.known).map(x => x.hash));
      const localWalk = super.walkCommits(hash);
      const localCommits = await getCommits(localWalk);
      const remoteWalk = super.walkCommits(...remoteHashes);
      const remoteCommits = await getCommits(remoteWalk);
      const commonCommits = getCommonCommits(localCommits, remoteCommits);
      const localObjects = new Map<Hash, Uint8Array>();
      for(const [hash, commit] of localCommits.entries()){
        await this.addToMap(hash, localObjects);
        if(await this.addToMap(commit.body.tree, localObjects)) continue;
        let hasSubtree = true
        for await(const {hash} of withFeedback(super.walkTree(commit.body.tree, true), () => !hasSubtree)){
          hasSubtree = await this.addToMap(hash, localObjects);
        }
      }

      return await push(url, fetch, [command], localObjects, auth);
    }

    private async addToMap(hash : string, map : Map<Hash, Uint8Array>) {
      if(map.has(hash)) return true;
      const raw = await super.loadRaw(hash);
      if(!raw) return true;
      map.set(hash, raw);
      return false;
    }
  }
}

async function getCommits(walker : AsyncIterableIterator<HashAndCommitObject>){
  const commits = new Map<string, CommitObject>();
  for await(const commit of walker){
    commits.set(commit.hash, commit.commit);
  }

  return commits;
}

async function getCommonCommits(local : Map<string, CommitObject>, remote : Map<string, CommitObject>){
  const common = new Map<string, CommitObject>();
  for(const key of local.keys()){
    const object = remote.get(key);
    if(object){
      common.set(key, object);
      local.delete(key);
      remote.delete(key);
    }
  }
  return common
}

async function *withFeedback<T>(iterator : AsyncIterator<T>, feedback : () => any){
  try{
    while(true){
      const next = await iterator.next(feedback());
      if(next.done){
        return;
      }else{
        yield next.value;
      }
    }
  }finally{
    if(typeof iterator.return === 'function'){
      iterator.return();
    }
  }
}
