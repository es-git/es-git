import {
  concat,
  decode
} from '@es-git/core';

import composePackfile from './compose-packfile';
import {
  Type,
  Entry,
  NormalEntry,
  RawObject
} from './types';

export type HashBlob = [string, Uint8Array];

export default function(objects : Iterable<HashBlob>){
  return concat(...composePackfile([...toEntry(toRawObject(objects))]));
}

function *toRawObject(objects : Iterable<HashBlob>) : IterableIterator<RawObject> {
  for(const [hash, body] of objects){
    const space = body.indexOf(0x20)
    const nil = body.indexOf(0x00, space);
    yield {
      body: body.subarray(nil+1),
      type: decode(body, 0, space),
      hash: hash
    }
  }
}

function *toEntry(objects : IterableIterator<RawObject>) : IterableIterator<NormalEntry> {
  for(const object of objects){
    yield {
      body: object.body,
      type: object.type === 'commit' ? Type.commit
          : object.type === 'tree' ? Type.tree
          : Type.blob,
      offset: 0
    }
  }
}