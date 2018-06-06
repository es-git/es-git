import { Ref, HasObject, RemoteLocalRef } from './types';

export default async function findDifferingRefs(localRefs : Ref[], remoteRefs : RemoteLocalRef[], hasObject : HasObject){
  const localRefHashes = new Map(localRefs.map(r => [r.name, r.hash] as [string, string]));

  const different = remoteRefs.map(ref => ({
    name: ref.local,
    remoteHash: ref.hash,
    localHash: localRefHashes.get(ref.local)
  })).filter(r => r.remoteHash !== r.localHash);

  return await Promise.all(different
    .map(async ref => ({...ref, hasRemote: await hasObject(ref.remoteHash)})));
}
