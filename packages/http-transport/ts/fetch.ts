import { Ref, Hash } from './types';
import lsRemote, { Fetch as LsRemoteFetch } from './lsRemote';
import findDifferingRefs from './findDifferingRefs';
import negotiatePack from './negotiatePack';
import composeWantRequest from './composeWantRequest';
import commonCapabilities from './commonCapabilities';
import post, { Fetch as FetchPackFetch } from './post';
import parsePackResponse from './parsePackResponse';
import { unpack, RawObject, Progress } from '@es-git/packfile';
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
  readonly objects : AsyncIterableIterator<RawObject>
  readonly refs : RefChange[]
  readonly shallow : Promise<Hash[]>
  readonly unshallow : Promise<Hash[]>
}

export interface RefChange {
  readonly name : string | undefined
  readonly oldHash : string | undefined
  readonly hash : string
}

interface RefDiff {
  readonly name : string | undefined
  readonly localHash : string | undefined
  readonly remoteHash : string
  readonly hasRemote : boolean
}

export default async function fetch({url, fetch, localRefs, refspec, hasObject, depth, shallows, unshallow} : FetchRequest, progress? : Progress) : Promise<FetchResult> {
  const {capabilities, remoteRefs} = await lsRemote(url, fetch, 'git-upload-pack');

  if((depth || unshallow) && !capabilities.has('shallow')){
    throw new Error('remote does not support shallow fetch');
  }

  const differingRefs = await getRefsToFetch(refspec, remoteRefs, localRefs, hasObject);

  const wanted = differingRefs
    .filter(ref => !ref.hasRemote)
    .map(ref => ref.remoteHash)
    .concat(unshallow && shallows || [] as string[]);

  if(wanted.length === 0){
    return {
      objects: async function*() : AsyncIterableIterator<RawObject> {}(),
      refs: differingRefs.map(ref => ({name: ref.name, oldHash: ref.localHash, hash: ref.remoteHash})),
      shallow: Promise.resolve<Hash[]>([]),
      unshallow: Promise.resolve<Hash[]>([])
    }
  }

  const negotiate = negotiatePack(wanted, localRefs.map(ref => ref.hash), shallows, unshallow ? 0x7fffffff : depth);
  const body = composeWantRequest(negotiate, commonCapabilities(capabilities));
  const response = post(url, 'git-upload-pack', body, fetch);
  {
    const shallow = defer<string[]>();
    const unshallow = defer<string[]>();
    return {
      refs: differingRefs.map(ref => ({name: ref.name, oldHash: ref.localHash, hash: ref.remoteHash})),
      objects: unpack(createResult(response, shallow.resolve, unshallow.resolve, progress), progress),
      shallow: shallow.promise,
      unshallow: unshallow.promise
    };
  }
}

async function getRefsToFetch(refspec: string | string[], remoteRefs: Ref[], localRefs: Ref[], hasObject: (hash: string) => Promise<boolean>) : Promise<RefDiff[]> {
  if(!Array.isArray(refspec) && /^[a-f0-9]{40}$/i.test(refspec)){
    return [
      {
        hasRemote: await hasObject(refspec),
        localHash: undefined,
        remoteHash: refspec,
        name: undefined
      }
    ];
  }

  refspec = Array.isArray(refspec) ? refspec : [refspec];
  const refs = remotesToLocals(remoteRefs, refspec);
  return await findDifferingRefs(localRefs, refs, hasObject);
}

async function* createResult(response : AsyncIterableIterator<Uint8Array>, resolveShallow : (v : string[]) => void, resolveUnshallow : (v : string[]) => void, progress?: Progress){
  const shallow : string[] = [];
  const unshallow : string[] = [];
  for await(const parsed of parsePackResponse(response)){
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
      case 'error':
        if(progress) progress(parsed.message);
        break;
    }
  }
  resolveShallow(shallow);
  resolveUnshallow(unshallow);
}

