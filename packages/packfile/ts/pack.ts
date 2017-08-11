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

export interface HashBlob {
  readonly hash : string
  readonly body : Uint8Array
}

export default function(objects : IterableIterator<HashBlob>){
  return concat(...composePackfile([...toEntry(toRawObject(objects))]));
}

function *toRawObject(objects : IterableIterator<HashBlob>) : IterableIterator<RawObject> {
  for(const object of objects){
    yield {
      body: object.body,
      type: decode(object.body, 0, object.body.indexOf(0x20)),
      hash: object.hash
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