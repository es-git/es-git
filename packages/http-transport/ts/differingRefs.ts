import { Ref, HasObject } from './types';

export default async function differingRefs(localRefs : Ref[], remoteRefs : Ref[], hasObject : HasObject){
  const localRefsMap = new Map(localRefs.map(pair => [pair.name, pair.hash] as [string, string]));

  const different = await Promise.all(remoteRefs
    .filter(ref => !localRefsMap.has(ref.name) || localRefsMap.get(ref.name) !== ref.hash)
    .map(async ref => ({ref, has: await hasObject(ref.hash)})));

  return different.filter(r => !r.has).map(r => r.ref.hash);
}