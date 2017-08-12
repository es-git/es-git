import parseRemoteRefs from './parseRefsResponse';
import { Ref } from './types';

export interface Result {
  readonly capabilities : Map<string, string | boolean>,
  readonly remoteRefs : Ref[]
}

export type Fetch = (url : string) => Promise<FetchResponse>

export interface FetchResponse {
  text() : Promise<string>
  readonly status : number
  readonly statusText : string
}

export default async function lsRemote(url : string, fetch : Fetch, service : string = 'git-upload-pack') : Promise<Result> {
  const res = await fetch(`${url}/info/refs?service=${service}`);
  if(res.status !== 200) throw new Error(`ls-remote failed with ${res.status} ${res.statusText}`);
  const refs = await res.text();
  const capabilities = new Map<string, string | boolean>();
  const remoteRefs = [...parseRemoteRefs(refs, service, capabilities)];
  return {
    remoteRefs,
    capabilities
  };
}