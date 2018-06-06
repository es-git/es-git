import {
  decode
} from '@es-git/core';

import composePackfile from './compose-packfile';
import {
  Type,
  NormalEntry,
  RawObject
} from './types';
import pipe from './pipe';

export type HashBlob = [string, Uint8Array];

export default async function* pack(objects : AsyncIterableIterator<HashBlob>, count : number) : AsyncIterableIterator<Uint8Array> {
  yield* pipe(objects)
        .pipe(toRawObject)
        .pipe(toEntry)
        .pipe(sortByType)
        .pipe(x => composePackfile(x, count));
}

async function *toRawObject(objects : AsyncIterableIterator<HashBlob>) : AsyncIterableIterator<RawObject> {
  for await(const [hash, body] of objects){
    const space = body.indexOf(0x20)
    const nil = body.indexOf(0x00, space);
    yield {
      body: body.subarray(nil+1),
      type: decode(body, 0, space),
      hash: hash
    }
  }
}

async function *toEntry(objects : AsyncIterableIterator<RawObject>) : AsyncIterableIterator<NormalEntry> {
  for await(const object of objects){
    yield {
      body: object.body,
      type: object.type === 'commit' ? Type.commit
          : object.type === 'tree' ? Type.tree
          : Type.blob,
      offset: 0
    }
  }
}

async function* sortByType(entries : AsyncIterableIterator<NormalEntry>) {
  const commits = [];
  const trees = [];
  const blobs = [];
  const others = [];
  for await(const entry of entries){
    switch(entry.type){
      case Type.commit:
        commits.push(entry);
        break;
      case Type.tree:
        trees.push(entry);
        break;
      case Type.blob:
        blobs.push(entry);
        break;
      default:
        others.push(entry);
        break;
    }
  }
  yield* commits;
  yield* trees;
  yield* blobs;
  yield* others;
}

