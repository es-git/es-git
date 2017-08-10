import { Ref, HasObject, Hash } from './types';

export default async function differingRefs(localRefs : Hash[], remoteRefs : Ref[], refspecs : string[], hasObject : HasObject){
  const localRefsMap = new Set(localRefs);

  const specs = refspecs.map(spec => spec.split(':')[0]).map(local => ({
    star: local.charAt(local.length-1) === '*',
    test: local.replace('*', '')
  }));

  const different = await Promise.all(remoteRefs
    .filter(ref => !localRefsMap.has(ref.hash))
    .filter(ref => specs.some(spec => spec.star ? ref.name.startsWith(spec.test) : ref.name === spec.test))
    .map(async ref => ({ref, has: await hasObject(ref.hash)})));

  return different.filter(r => !r.has).map(r => r.ref.hash);
}