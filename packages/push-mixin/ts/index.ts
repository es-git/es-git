import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, HashAndCommitObject, withFeedback } from '@es-git/walkers-mixin';
import { lsRemote, push, Fetch, Command, Auth, Progress } from '@es-git/http-transport';

export { Fetch, Auth };

export interface RefHash {
  readonly ref : string
  readonly hash : Hash
}

export interface PushOptions {
  readonly progress? : Progress
}

export interface RemoteUrl {
  readonly remote : string
  readonly url : string
}

export interface IPushRepo {
  push(remote : string | RemoteUrl, ref : string | string[], auth? : Auth, options? : PushOptions) : Promise<RefHash[]>
}

export default function pushMixin<T extends Constructor<IObjectRepo & IWalkersRepo & IRawRepo>>(repo : T, fetch : Fetch) : Constructor<IPushRepo> & T {
  return class PushRepo extends repo implements IPushRepo {
    async push(remote : string | RemoteUrl, ref : string | string[], auth? : Auth, options : PushOptions = {}) : Promise<RefHash[]> {
      const pairs = await this.getRefs(ref);

      const url = typeof remote === 'string' ? remote : remote.url;

      const {remoteRefs, capabilities} = await lsRemote(url, fetch);
      const pairsToUpdate = pairs.map(({ref, hash}) => ({
        ref,
        hash,
        remoteHash: (remoteRefs.filter(r => r.name === ref)[0] || {hash:'00'}).hash
      })).filter(p => p.hash !== p.remoteHash);
      if(pairsToUpdate.length === 0) return [];

      const remoteHashes = await Promise.all(remoteRefs.map(async ({hash}) => ({hash, known: await super.hasObject(hash)})))
        .then(a => a.filter(x => x.known).map(x => x.hash));
      const localWalk = super.walkCommits(...pairsToUpdate.map(p => p.hash));
      const localCommits = await getCommits(localWalk);
      const remoteWalk = super.walkCommits(...remoteHashes);
      const remoteCommits = await getCommits(remoteWalk);
      const commonCommits = getCommonCommits(localCommits, remoteCommits);
      const localObjects = new Map<Hash, Uint8Array>();
      for(const [hash, commit] of localCommits.entries()){
        await this.addToMap(hash, localObjects, options.progress);
        if(await this.addToMap(commit.body.tree, localObjects, options.progress)) continue;
        const walkTtree = withFeedback(super.walkTree(commit.body.tree, true), true);
        for await(const {hash} of walkTtree){
          walkTtree.feedback = await this.addToMap(hash, localObjects, options.progress);
        }
      }
      if(options.progress) options.progress(`Counting objects: ${localObjects.size}, done.\n`);

      await push(url, fetch, pairsToUpdate.map(makeCommand), localObjects, auth, options.progress);

      if(typeof remote !== 'string'){
        const remotePrefix = `refs/remotes/${remote.remote}/`;
        await Promise.all(pairsToUpdate.map(({ref, hash}) => super.setRef(ref.replace('refs/heads/', remotePrefix), hash)));
      }

      return pairsToUpdate;
    }

    private async addToMap(hash : string, map : Map<Hash, Uint8Array>, progress? : Progress) {
      if(map.has(hash)) return true;
      const raw = await super.loadRaw(hash);
      if(!raw) return true;
      map.set(hash, raw);
      if(progress) progress(`Counting objects: ${map.size}\r`);
      return false;
    }

    private async getRefs(ref : string | string[]){
      const refs = Array.isArray(ref) ? ref : [ref];
      const pairs = await Promise.all(refs.map(async ref => ({
        ref,
        hash: await super.getRef(ref)
      })));
      const unknownRefs = pairs.filter(p => p.hash === undefined);
      if(unknownRefs.length > 0) throw new Error(`Unknown refs ${unknownRefs.map(p => p.ref).join(', ')}`);

      return pairs as RefHash[];
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

function makeCommand({ref, hash, remoteHash} : {ref : string, hash : string, remoteHash : string}) : Command{
  if(remoteHash === '00'){
    return {
      type: 'create',
      ref,
      hash
    };
  }

  return {
    type: 'update',
    ref,
    oldHash: remoteHash,
    newHash: hash
  };
}