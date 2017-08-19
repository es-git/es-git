import { Type, Mode, Constructor, IRawRepo, Hash, isFile, encode, decode } from '@es-git/core';
import { fetch as gitFetch, Fetch } from '@es-git/http-transport';

export interface FetchOptions {
  readonly refspec? : string | string[]
  readonly depth? : number,
  readonly unshallow? : boolean
}

export interface IFetchRepo {
  fetch(url : string, options? : FetchOptions) : Promise<void>
}

export default function fetchMixin<T extends Constructor<IRawRepo>>(repo : T, fetch : Fetch) : Constructor<IFetchRepo> & T {
  return class FetchRepo extends repo implements IFetchRepo {
    async fetch(url : string, options : FetchOptions = {}) : Promise<void>{
      const refNames = await super.listRefs();
      const localRefs = await Promise.all(refNames.map(name => super.getRef(name) as Promise<string>));
      const shallows = toArray(await super.loadMetadata('shallow'));
      const {objects, refs, shallow, unshallow} = await gitFetch({
        url,
        fetch,
        localRefs,
        refspec: options.refspec || 'refs/heads/*:refs/remotes/origin/*',
        hasObject: hash => super.hasObject(hash),
        depth: options.depth,
        shallows
      });

      for(const {hash, body} of objects){
        await super.saveRaw(hash, body);
      }

      for(const {name, hash} of refs){
        await super.setRef(name, hash);
      }

      await super.saveMetadata('shallow', fromArray(shallows.concat(shallow).filter(hash => !unshallow.includes(hash))));
    }
  }
}

export function toArray(contents : Uint8Array | undefined){
  if(!contents){
    return []
  }

  return decode(contents).split('\n');
}

export function fromArray(lines : Hash[]) : Uint8Array | undefined {
  if(lines.length == 0){
    return undefined;
  }

  return encode(lines.join('\n'));
}