import { concat, decode } from '@es-git/core';
import { Ref, HasObject, Hash } from './types';
import lsRemote, { Fetch as LsRemoteFetch } from './lsRemote';
import differingRefs from './differingRefs';
import negotiatePack from './negotiatePack';
import composeWantRequest from './composeWantRequest';
import commonCapabilities from './commonCapabilities';
import post, { Fetch as FetchPackFetch } from './post';
import parseWantResponse, { Token } from './parseWantResponse';
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
  objects : AsyncIterableIterator<RawObject>
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
      objects: async function*() : AsyncIterableIterator<RawObject> {}(),
      refs: [] as Ref[],
      shallow: [] as Hash[],
      unshallow: [] as Hash[]
    }
  }

  const negotiate = negotiatePack(wanted, localRefs, shallows, unshallow ? 0x7fffffff : depth);
  const body = concat(...composeWantRequest(negotiate, commonCapabilities(capabilities)));
  const response = post(url, 'git-upload-pack', body, fetch);
  const result = {
    shallow: [] as string[],
    unshallow: [] as string[],
    refs: remoteRefs.map(remoteToLocal(refspec)).filter(x => x) as Ref[]
  };
  console.log('----');
  for await(const parsed of parseWantResponse(response)){
    console.log(parsed.type);
    switch(parsed.type){
      case 'shallow':
        result.shallow.push(parsed.hash);
        continue;
      case 'unshallow':
        result.unshallow.push(parsed.hash);
        continue;
      case 'pack':
        return {
          ...result,
          objects: unpack(parsed.chunks)
        };
    }
  }
  console.log('====');
  throw new Error('No pack in response :(');
}

async function* collect(response : AsyncIterableIterator<Token>, progress: (message: string) => void){
  const shallows : string[] = [];
  const unshallows : string[] = [];
  for await(const item of response){
    if(item.type == 'shallow'){
      shallows.push(item.hash);
    }else if(item.type == 'unshallow'){
      unshallows.push(item.hash);
    }else if(item.type == 'pack'){
      yield* unpack(item.chunks);
    }else if(item.type == 'progress'){
      progress(item.message);
    }
  }
}
