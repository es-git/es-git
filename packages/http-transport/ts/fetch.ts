import { concat, decode } from '@es-git/core';
import { Ref, HasObject, Hash } from './types';
import lsRemote, { Fetch as LsRemoteFetch } from './lsRemote';
import differingRefs from './differingRefs';
import negotiatePack from './negotiatePack';
import composeWantRequest from './composeWantRequest';
import commonCapabilities from './commonCapabilities';
import post, { Fetch as FetchPackFetch } from './post';
import parseWantResponse from './parseWantResponse';
import { unpack, RawObject } from '@es-git/packfile';
import remoteToLocal from './remoteToLocal';

export type Fetch = LsRemoteFetch & FetchPackFetch;
export { RawObject };

export interface FetchResult {
  objects: IterableIterator<RawObject>,
  refs: Ref[]
}

export default async function fetch(url : string, fetch : Fetch, localRefs : Hash[], refspecs : string | string[], hasObject : HasObject) : Promise<FetchResult> {
  refspecs = Array.isArray(refspecs) ? refspecs : [refspecs];
  const {capabilities, remoteRefs} = await lsRemote(url, fetch, 'git-upload-pack');

  const wanted = await differingRefs(localRefs, remoteRefs, refspecs, hasObject);

  if(wanted.length == 0){
    return {
      objects: function*() : IterableIterator<RawObject> {}(),
      refs: [] as Ref[]
    }
  }

  const negotiate = negotiatePack(wanted, localRefs)
  const body = concat(...composeWantRequest(negotiate, commonCapabilities(capabilities)));
  const response = await post(url, 'git-upload-pack', body, fetch);
  const parsedResponse = parseWantResponse(response);
  if(parsedResponse.type !== 'pack') throw new Error('fetch failed, no pack returned');

  return {
    objects: unpack(parsedResponse.pack),
    refs: remoteRefs.map(remoteToLocal(refspecs)).filter(x => x) as Ref[]
  };
}

