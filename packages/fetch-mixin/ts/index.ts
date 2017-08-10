import { Type, Mode, Constructor, IRawRepo, Hash, isFile, encode } from '@es-git/core';
import { fetch, Fetch } from '@es-git/http-transport';

export interface IFetchRepo {
  fetch(url : string, remote : string) : Promise<void>
}

export default function fetchMixin<T extends Constructor<IRawRepo>>(repo : T) : Constructor<IFetchRepo> & T {
  return class FetchRepo extends repo implements IFetchRepo {
    private readonly _fetch : Fetch
    constructor(...args : any[])
    constructor(fetch : Fetch, ...args : any[]){
      super(...args);
      this._fetch = fetch;
    }

    async fetch(url : string, remote : string) : Promise<void>{
      const refNames = await super.listRefs();
      const localRefs = await Promise.all(refNames.map(async name => ({
        name,
        hash: await super.getRef(name) as string
      })));
      const {objects, refs} = await fetch(url, this._fetch, localRefs, async hash => !!(await super.loadRaw(hash)));
      for(const {hash, body} of objects){
        await super.saveRaw(hash, body);
      }

      const remoteRefs = refs.map(ref => ({
        name: ref.name.replace(/^refs\/heads/, `refs/remotes/${remote}`),
        hash: ref.hash
      }));

      for(const {name, hash} of remoteRefs){
        await super.setRef(name, hash);
      }
    }
  }
}