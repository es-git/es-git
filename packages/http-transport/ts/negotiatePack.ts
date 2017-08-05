// https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt
// https://github.com/git/git/blob/master/Documentation/technical/pack-protocol.txt

import Queue from './queue';
import { Hash, UploadRequest } from './types';

export default function *negotiatePack(wanted : Hash[], localRefs : Hash[], remoteRefs : Hash[]) : IterableIterator<UploadRequest> {
  const advertised = new Set<Hash>(remoteRefs);
  const common = new Set<Hash>();
  const want = new Set<Hash>(wanted);
  const pending = new Queue<Hash>(localRefs);

  while(want.size > 0){
    const response = yield {
      wants: Array.from(want),
      shallows: [],
      deepens: [],
      haves: pending.pop(32),
      done: pending.isEmpty
    };

    want.clear();
  }
}

