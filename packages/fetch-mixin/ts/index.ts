import { Type, Mode, Constructor, IRawRepo, Hash, isFile, encode, decode } from '@es-git/core';
import { fetch as gitFetch, lsRemote, Fetch, Ref, RefChange } from '@es-git/http-transport';

export interface FetchOptions {
  readonly refspec? : string | string[]
  readonly depth? : number,
  readonly unshallow? : boolean,
  readonly progress? : (status : string) => void
}

export interface IFetchRepo {
  fetch(url : string, options? : FetchOptions) : Promise<RefChange[]>
  lsRemote(url : string) : Promise<Ref[]>
}

export default function fetchMixin<T extends Constructor<IRawRepo>>(repo : T, fetch : Fetch) : Constructor<IFetchRepo> & T {
  return class FetchRepo extends repo implements IFetchRepo {
    async fetch(url : string, options : FetchOptions = {}) : Promise<RefChange[]> {
      const refNames = await super.listRefs();
      const localRefs = await Promise.all(refNames.map(async name => ({name, hash: await super.getRef(name) as string})));
      const shallows = toArray(await super.loadMetadata('shallow'));
      const {objects, refs, ...result} = await gitFetch({
        url,
        fetch,
        localRefs,
        refspec: options.refspec || 'refs/heads/*:refs/remotes/origin/*',
        hasObject: hash => super.hasObject(hash),
        depth: options.depth,
        shallows
      },
      options.progress);

      for await(const {hash, body} of objects){
        await super.saveRaw(hash, body);
      }

      const unshallow = await result.unshallow;
      const shallow = await result.shallow;
      if(shallow.length || unshallow.length){
        await super.saveMetadata('shallow', fromArray(shallows.concat(shallow).filter(hash => !unshallow.includes(hash))));
      }

      for(const {name, to} of refs){
        await super.setRef(name, to);
      }

      return refs;
    }
    async lsRemote(url : string) : Promise<Ref[]> {
      const result = await lsRemote(url, fetch);
      return result.remoteRefs;
    }
  }
}

export function toArray(contents : Uint8Array | undefined){
  if(!contents){
    return []
  }

  return decode(contents).split('\n');
}

export function fromArray(lines : Hash[]) : Uint8Array {
  return encode(lines.join('\n'));
}