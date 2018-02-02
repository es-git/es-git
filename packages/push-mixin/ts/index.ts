import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, withFeedback } from '@es-git/walkers-mixin';
import { lsRemote, push, Fetch, Command, Auth, Progress } from '@es-git/http-transport';
import findCommonCommits from './findCommonCommits';
import getObjectsToPush from './getObjectsToPush';

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
      const pairs = await getRefs(ref, ref => super.getRef(ref));

      const url = typeof remote === 'string' ? remote : remote.url;

      const {remoteRefs, capabilities} = await lsRemote(url, fetch);

      const pairsToUpdate = pairs.map(({ref, hash}) => ({
        ref,
        hash,
        remoteHash: (remoteRefs.filter(r => r.name === ref)[0] || {hash:'00'}).hash
      })).filter(p => p.hash !== p.remoteHash);
      if(pairsToUpdate.length === 0) return [];

      const localHashes = pairsToUpdate.map(l => l.hash);
      const remoteHashes = remoteRefs.map(r => r.hash);

      const objects = await getObjectsToPush(localHashes, remoteHashes, this, options.progress ? options.progress : () => {});

      await push(url, fetch, pairsToUpdate.map(makeCommand), objects, auth, options.progress);

      if(typeof remote !== 'string'){
        const remotePrefix = `refs/remotes/${remote.remote}/`;
        await Promise.all(pairsToUpdate.map(({ref, hash}) => super.setRef(ref.replace('refs/heads/', remotePrefix), hash)));
      }

      return pairsToUpdate;
    }
  }
}


async function getRefs(ref : string | string[], getRef : (ref : string) => Promise<string | undefined>){
  const refs = Array.isArray(ref) ? ref : [ref];
  const pairs = await Promise.all(refs.map(async ref => ({
    ref,
    hash: await getRef(ref)
  })));
  const unknownRefs = pairs.filter(p => p.hash === undefined);
  if(unknownRefs.length > 0) throw new Error(`Unknown refs ${unknownRefs.map(p => p.ref).join(', ')}`);

  return pairs as RefHash[];
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
