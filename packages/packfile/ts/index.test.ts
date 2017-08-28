import test from 'ava';
import { pack, unpack, RawObject } from './index';

import { encode, decode } from '@es-git/core';

test('pack-unpack', t => {

  const blobs = [
    'blob 4\0test',
    'commit 7\0testing'
  ];

  const result = unpack(pack(prepare(blobs)));
  t.deepEqual([
    'commit 7\0testing',
    'blob 4\0test'
  ], postpare(result));
});

function prepare(blobs : string[]){
  return blobs.map(x => (['00', encode(x)] as [string, Uint8Array]));
}

function postpare(result : Iterable<RawObject>){
  return [...result].map(r => decode(r.body))
}