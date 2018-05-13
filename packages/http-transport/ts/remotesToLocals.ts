import { Ref, RemoteLocalRef } from './types';

export default function remotesToLocals(remoteRefs : Ref[], refspec : string[]) : RemoteLocalRef[]{
  return remoteRefs
    .map(remoteToLocal(refspec))
    .filter(x => x) as RemoteLocalRef[];
}

function remoteToLocal(refspecs : string[]) : (ref : Ref) => RemoteLocalRef | undefined {
  const specs = makeSpec(refspecs);

  return ({hash, name}) => {
    const found = specs.find(spec => name.startsWith(spec.test));
    if(!found){
      return undefined;
    }

    const {test, local, star} = found;
    if(star){
      return {
        hash,
        remote: name,
        local: local.replace('*', name.replace(test, ''))
      };
    }else{
      return {
        hash,
        remote: name,
        local
      };
    }
  };
}

function makeSpec(refspecs : string[]){
  return refspecs
    .map(spec => spec.split(':'))
    .map(([remote, local]) => ({
      star: remote.charAt(remote.length-1) === '*',
      test: remote.replace('*', ''),
      local,
      remote
    }));
}

declare interface Array<T> {
    filter<U extends T>(pred: (a: T, i : number, e : Array<T>) => a is U): U[];
}