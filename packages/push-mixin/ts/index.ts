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
      const commands : Command[] = [
        {
          type: 'update',
          ref,
          oldHash: remoteRef.hash,
          newHash: hash
        }
      ];
      const localWalk = super.walkCommits(hash);
      const localCommits = await getCommits(localWalk);
      const remoteWalk = super.walkCommits(...remoteRefs.map(r => r.hash));
      const remoteCommits = await getCommits(remoteWalk);
      const commonCommits = getCommonCommits(localCommits, remoteCommits);
      const localObjects = new Map<Hash, Uint8Array>();
      for(const [hash, commit] of localCommits.entries()){
        await this.addToMap(hash, localObjects);
        if(await this.addToMap(commit.body.tree, localObjects)) continue;
        for await(const {hash} of super.walkTree(commit.body.tree, true)){
          await this.addToMap(hash, localObjects);
        }
      }

      return await push(url, fetch, commands, localObjects, auth);
    }

    private async addToMap(hash : string, map : Map<Hash, Uint8Array>) {
      if(map.has(hash)) return true;
      const object = await super.loadRaw(hash);
      if(!object) return true;
      map.set(hash, object);
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