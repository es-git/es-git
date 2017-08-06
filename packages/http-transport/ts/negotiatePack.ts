// https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt
// https://github.com/git/git/blob/master/Documentation/technical/pack-protocol.txt

import Queue from './queue';
import { Hash, UploadRequest } from './types';

export default function *negotiatePack(wanted : Hash[], localRefs : Hash[], remoteRefs : Hash[]) : IterableIterator<UploadRequest> {
  const advertised = new Set<Hash>(remoteRefs);
  const common = new Set<Hash>();
  const want = new Set<Hash>(wanted);
  const pending = new Queue<Hash>(localRefs);

  let haveCount = 0;
  while(want.size > 0){
    if(haveCount > 256){
      // we have nothing in common
      // I give up...
      return;
    }

    const haves = pending.pop(32);
    haveCount += haves.length;
    const response : string[] = yield {
      wants: Array.from(want),
      shallows: [],
      deepens: [],
      haves,
      done: pending.isEmpty
    };

    for(const acked of response){
      common.add(acked);
    }

    want.clear();
  }
}

