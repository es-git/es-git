import { Type, Mode, Constructor, IRawRepo, Hash, isFile } from '@es-git/core';
import { IObjectRepo, GitObject, CommitObject, TreeObject } from '@es-git/object-mixin';
import { IWalkersRepo, withFeedback } from '@es-git/walkers-mixin';
import { lsRemote, push, Fetch, Command, Auth, Progress, Ref } from '@es-git/http-transport';
import findCommonCommits from './findCommonCommits';
import getObjectsToPush from './getObjectsToPush';

export { Fetch, Auth };

export interface PushOptions {
  readonly progress? : Progress
}

export interface LocalRemoteTrackingRef {
  readonly local : string
  readonly remote? : string
  readonly tracking? : string
}

export interface RefResult {
  readonly local : string
  readonly remote? : string
  readonly tracking? : string
  readonly hash : string
  readonly remoteHash? : string
}

export interface IPushRepo {
  push(url : string, ref : string | LocalRemoteTrackingRef | (string | LocalRemoteTrackingRef)[], auth? : Auth, options? : PushOptions) : Promise<RefResult[]>
}

export default function pushMixin<T extends Constructor<IObjectRepo & IWalkersRepo & IRawRepo>>(repo : T, fetch : Fetch) : Constructor<IPushRepo> & T {
  return class PushRepo extends repo implements IPushRepo {
    async push(url : string, ref : string | LocalRemoteTrackingRef | (string | LocalRemoteTrackingRef)[], auth? : Auth, options : PushOptions = {}) : Promise<RefResult[]> {
      const refs = await getRefs(ref, ref => super.getRef(ref));

      const {remoteRefs} = await lsRemote(url, fetch);
      const remoteMap = new Map<string, string>(remoteRefs.map<[string, string]>(r => [r.name, r.hash]));

      const refsToPush = refs.map(ref => ({
        ...ref,
        remoteHash: remoteMap.get(ref.remote)
      })).filter(p => p.hash !== p.remoteHash);

      if(refsToPush.length === 0) return [];

      const localHashes = refsToPush.map(l => l.hash);
      const remoteHashes = remoteRefs.map(r => r.hash);

      const objects = await getObjectsToPush(localHashes, remoteHashes, {
        walkCommits: (...hash : string[]) => super.walkCommits(...hash),
        walkTree: (hash : string) => super.walkTree(hash),
        loadRaw: (hash : string) => super.loadRaw(hash),
        progress: (message : string) => options.progress && options.progress(message)
      });

      await push(url, fetch, refsToPush.map(makeCommand), objects, auth, options.progress);

      for(const ref of refsToPush){
        if(ref.tracking){
          await super.setRef(ref.tracking, ref.hash);
        }
      }

      return refsToPush;
    }
  }
}

async function getRefs(ref : string | LocalRemoteTrackingRef | (string | LocalRemoteTrackingRef)[], getRef : (ref : string) => Promise<string | undefined>){
  const refs = Array.isArray(ref) ? ref : [ref];
  const pairs = await Promise.all(refs.map(toObject).map(async ref => ({
    ...ref,
    hash: await getRef(ref.local).then(h => h || '??')
  })));
  const unknownRefs = pairs.filter(p => p.hash === '??');
  if(unknownRefs.length > 0) throw new Error(`Unknown refs ${unknownRefs.map(p => p.local).join(', ')}`);

  return pairs;
}

function toObject(ref : string | LocalRemoteTrackingRef){
  if(typeof ref === 'string'){
    return {
      local: ref,
      remote: ref,
      tracking: undefined
    }
  }

  return {
    local: ref.local,
    remote: ref.remote || ref.local,
    tracking: ref.tracking
  };
}

function makeCommand({remote, hash, remoteHash} : {remote : string, hash : string, remoteHash? : string}) : Command{
  if(remoteHash === undefined){
    return {
      type: 'create',
      ref: remote,
      hash
    };
  }

  return {
    type: 'update',
    ref: remote,
    oldHash: remoteHash,
    newHash: hash
  };
}
