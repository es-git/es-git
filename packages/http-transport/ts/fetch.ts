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

export interface FetchRequest {
  readonly url : string
  readonly fetch : Fetch
  readonly localRefs: Hash[]
  readonly refspec : string | string[]
  hasObject(hash : string) : Promise<boolean>
  readonly depth? : number
  readonly shallows? : Hash[]
  readonly unshallow? : boolean
}

export interface FetchResult {
  objects : IterableIterator<RawObject>
  refs : Ref[]
  shallow : Hash[]
  unshallow : Hash[]
}

export default async function fetch({url, fetch, localRefs, refspec, hasObject, depth, shallows, unshallow} : FetchRequest) : Promise<FetchResult> {
  const {capabilities, remoteRefs} = await lsRemote(url, fetch, 'git-upload-pack');

  if((depth || unshallow) && !capabilities.has('shallow')){
    throw new Error('remote does not support shallow fetch');
  }

  refspec = Array.isArray(refspec) ? refspec : [refspec];
  const wanted = await differingRefs(localRefs, remoteRefs, refspec, hasObject, shallows, unshallow);

  if(wanted.length == 0){
    return {
      objects: function*() : IterableIterator<RawObject> {}(),
      refs: [] as Ref[],
      shallow: [] as Hash[],
      unshallow: [] as Hash[]
    }
  }

  const negotiate = negotiatePack(wanted, localRefs, shallows, unshallow ? 0x7fffffff : depth);
  const body = concat(...composeWantRequest(negotiate, commonCapabilities(capabilities)));
  const response = await post(url, 'git-upload-pack', body, fetch);
  const parsedResponse = parseWantResponse(response);
  if(parsedResponse.type !== 'pack') throw new Error('fetch failed, no pack returned');

  return {
    objects: unpack(parsedResponse.pack),
    refs: remoteRefs.map(remoteToLocal(refspec)).filter(x => x) as Ref[],
    shallow: parsedResponse.shallow,
    unshallow: parsedResponse.unshallow
  };
}

