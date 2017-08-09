import { Ref, HasObject } from './types';
import lsRemote, { Fetch as LsRemoteFetch } from './lsRemote';
import differingRefs from './differingRefs';
import negotiatePack from './negotiatePack';
import composeWantRequest from './composeWantRequest';
import commonCapabilities from './commonCapabilities';
import fetchPack, { Fetch as FetchPackFetch } from './fetchPack';
import parseWantResponse from './parseWantResponse';
import { unpack, RawObject } from '@es-git/packfile';

export type Fetch = LsRemoteFetch & FetchPackFetch;
export { RawObject };

export default async function fetch(url : string, fetch : Fetch, localRefs : Ref[], hasObject : HasObject){
  const {capabilities, remoteRefs} = await lsRemote(url, fetch);

  const wanted = await differingRefs(localRefs, remoteRefs, hasObject);

  const negotiate = negotiatePack(wanted, localRefs.map(r => r.hash))
  const body = composeWantRequest(negotiate, commonCapabilities(capabilities));
  const response = await fetchPack(url, body, fetch);
  const parsedResponse = parseWantResponse(response);
  if(parsedResponse.type !== 'pack') throw new Error('fetch failed');

  return {
    objects: unpack(parsedResponse.pack),
    refs: remoteRefs
  };
}
