import test from 'ava';
import { pack, unpack, RawObject } from './index';

import { encode, decode } from '@es-git/core';

test('pack-unpack', async t => {

  const blobs = [
    'blob 4\0test',
    'commit 7\0testing'
  ];

  const result = unpack(gen(pack(prepare(blobs))));
  t.deepEqual([
    'commit 7\0testing',
    'blob 4\0test'
  ], await postpare(result));
});

async function* gen<T>(item : T) : AsyncIterableIterator<T> {
  yield item;
}

function prepare(blobs : string[]){
  return blobs.map(x => (['00', encode(x)] as [string, Uint8Array]));
}

async function postpare(iterator : AsyncIterableIterator<RawObject>){
  const result : string[] = [];
  for await(const item of iterator){
    result.push(decode(item.body));
  }
  return result
}