import test from 'ava';
import { pack, unpack, RawObject } from './index';

import { encode, decode } from '@es-git/core';
import pipe from './pipe';

test('pack-unpack', async t => {

  const blobs = [
    'blob 4\0test',
    'commit 7\0testing'
  ];

  const result = pipe(prepare(blobs))
                .pipe(x => pack(x, 2))
                .pipe(unpack)
                .then(collect);
  t.deepEqual([
    'commit 7\0testing',
    'blob 4\0test'
  ], await result);
});

async function* prepare(blobs : string[]){
  yield* blobs.map(x => (['00', encode(x)] as [string, Uint8Array]));
}

async function collect(iterator : AsyncIterableIterator<RawObject>){
  const result : string[] = [];
  for await(const item of iterator){
    result.push(decode(item.body));
  }
  return result
}