// https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt
// https://github.com/git/git/blob/master/Documentation/technical/pack-protocol.txt

import { Hash, UploadRequest } from './types';

export default function negotiatePack(wants : Hash[], haves : Hash[]) : UploadRequest {
  return {
    wants,
    shallows: [],
    haves,
    done: true
  };
}

function findCommon(a : string[], b : string[]){
  return a.filter(a => b.indexOf(a) >= 0);
}