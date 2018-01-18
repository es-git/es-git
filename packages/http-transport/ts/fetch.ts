import { Ref, HasObject, Hash } from './types';
import lsRemote, { Fetch as LsRemoteFetch } from './lsRemote';
import findDifferingRefs from './findDifferingRefs';
import negotiatePack from './negotiatePack';
import composeWantRequest from './composeWantRequest';
import commonCapabilities from './commonCapabilities';
import post, { Fetch as FetchPackFetch } from './post';
import parseWantResponse, { Token } from './parseWantResponse';
import { unpack, RawObject } from '@es-git/packfile';
import remotesToLocals from './remotesToLocals';
import defer from './utils/defer';

export type Fetch = LsRemoteFetch & FetchPackFetch;
export { RawObject };

export interface FetchRequest {
  readonly url : string
  readonly fetch : Fetch
  readonly localRefs: Ref[]
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
  const refs = remotesToLocals(remoteRefs, refspec);
  const differingRefs = await findDifferingRefs(localRefs, refs, hasObject);

  if(differingRefs.length === 0 && !unshallow){
    return {
      objects: async function*() : AsyncIterableIterator<RawObject> {}(),
      refs: [] as Ref[],
      shallow: Promise.resolve<Hash[]>([]),
      unshallow: Promise.resolve<Hash[]>([])
    }
  }

  const wanted = differingRefs.filter(ref => !ref.hasRemote).map(ref => ref.remoteHash).concat(unshallow && shallows || [] as string[]);

  const negotiate = negotiatePack(wanted, localRefs.map(ref => ref.hash), shallows, unshallow ? 0x7fffffff : depth);
  const body = composeWantRequest(negotiate, commonCapabilities(capabilities));
  const response = post(url, 'git-upload-pack', body, fetch);
  {
    const shallow = defer<string[]>();
    const unshallow = defer<string[]>();
    return {
      refs: differingRefs.map(ref => ({name: ref.local, hash: ref.remoteHash})),
      objects: unpack(createResult(response, shallow.resolve, unshallow.resolve, progress), progress),
      shallow: shallow.promise,
      unshallow: unshallow.promise
    };
  }
}

async function* createResult(response : AsyncIterableIterator<Uint8Array>, resolveShallow : (v : string[]) => void, resolveUnshallow : (v : string[]) => void, progress?: (message: string) => void){
  const shallow : string[] = [];
  const unshallow : string[] = [];
  for await(const parsed of parseWantResponse(response)){
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

async function* unpackWithProgress(chunks : AsyncIterableIterator<Uint8Array>, progress?: (message : string) => void){
  let count = 0;
  for await(const object of unpack(chunks)){
    count++;
    if(progress) progress(`Receiving objects: ?% (${count}/?)\r`);
    yield object;
  }
  if(progress) progress(`Receiving objects: 100% (${count}/${count}), done.\n`);
}