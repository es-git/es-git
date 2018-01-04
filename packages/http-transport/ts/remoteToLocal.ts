import { Ref } from './types';

export default function getRefs(remoteRefs : Ref[], refspec : string[]) : Ref[]{
  return remoteRefs.map(remoteToLocal(refspec)).filter(x => x) as Ref[];
}

function remoteToLocal(refspecs : string[]) : (ref : Ref) => Ref | undefined {
  const specs = refspecs.map(spec => spec.split(':')).map(([local, remote]) => ({
    star: local.charAt(local.length-1) === '*',
    test: local.replace('*', ''),
    local,
    remote
  }));

  return ({hash, name}) => {
    for(const {test, local, remote, star} of specs){
      if(name.startsWith(test)){
        if(star){
          return {
            hash,
            name: remote.replace('*', name.replace(test, ''))
          };
        }else{
          return {
            hash,
            name: remote
          };
        }
      }
    }
    return undefined;
  };
}

declare interface Array<T> {
    filter<U extends T>(pred: (a: T, i : number, e : Array<T>) => a is U): U[];
}