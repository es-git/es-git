import { Type, Mode, Constructor, IRawRepo, Hash, isFile, encode } from '@es-git/core';
import { fetch, Fetch } from '@es-git/http-transport';

export interface FetchOptions {
  refspec? : string | string[]
}

export interface IFetchRepo {
  fetch(url : string, options? : FetchOptions) : Promise<void>
}

export default function fetchMixin<T extends Constructor<IRawRepo>>(repo : T) : Constructor<IFetchRepo> & T {
  return class FetchRepo extends repo implements IFetchRepo {
    private readonly _fetch : Fetch
    constructor(...args : any[])
    constructor(fetch : Fetch, ...args : any[]){
      super(...args);
      this._fetch = fetch;
    }

    async fetch(url : string, options : FetchOptions = {}) : Promise<void>{
      const refNames = await super.listRefs();
      const localRefs = await Promise.all(refNames.map(name => super.getRef(name) as Promise<string>));
      const {objects, refs} = await fetch(
        url,
        this._fetch,
        localRefs,
        options.refspec || 'refs/heads/*:refs/remotes/origin/*',
        hash => super.hasObject(hash));

      for(const {hash, body} of objects){
        await super.saveRaw(hash, body);
      }

      for(const {name, hash} of refs){
        await super.setRef(name, hash);
      }
    }
  }
}
