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
import defer from './utils/defer';

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
  shallow : Promise<Hash[]>
  unshallow : Promise<Hash[]>
}

export default async function fetch({url, fetch, localRefs, refspec, hasObject, depth, shallows, unshallow} : FetchRequest, progress? : (message : string) => void) : Promise<FetchResult> {
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
      shallow: Promise.resolve<Hash[]>([]),
      unshallow: Promise.resolve<Hash[]>([])
    }
  }

  const negotiate = negotiatePack(wanted, localRefs, shallows, unshallow ? 0x7fffffff : depth);
  const body = composeWantRequest(negotiate, commonCapabilities(capabilities));
  const response = post(url, 'git-upload-pack', body, fetch);
  {
    const shallow = defer<string[]>();
    const unshallow = defer<string[]>();
    return {
      refs: remoteToLocal(remoteRefs, refspec),
      objects: unpack(createResult(parseWantResponse(response), shallow.resolve, unshallow.resolve, progress)),
      shallow: shallow.promise,
      unshallow: unshallow.promise
    };
  }
}

async function* createResult(response : AsyncIterableIterator<Token>, resolveShallow : (v : string[]) => void, resolveUnshallow : (v : string[]) => void, progress?: (message: string) => void){
  const shallow : string[] = [];
  const unshallow : string[] = [];
  for await(const parsed of response){
    switch(parsed.type){
      case 'shallow':
        shallow.push(parsed.hash);
        break;
      case 'unshallow':
        unshallow.push(parsed.hash);
        break;
      case 'ack':
      case 'nak':
        break;
      case 'pack':
        yield* parsed.chunks;
        break;
      case 'progress':
        if(progress) progress(parsed.message);
        break;
    }
  }
  resolveShallow(shallow);
  resolveUnshallow(unshallow);
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
