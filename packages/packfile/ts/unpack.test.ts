import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';

import unpack from './unpack';
import { Type, OfsDeltaEntry, Entry } from './types';

test('unpack sample', async t => {
  const pack = await promisify(fs.readFile)(__dirname + '/../samples/sample1.pack');
  const entries = await collect(unpack(gen(new Uint8Array(pack))));

  //t.snapshot(decoder.decode(entries[2120].body));
  t.is(entries.length, 2651);
});

async function* gen<T>(item : T) : AsyncIterableIterator<T> {
  yield item;
}

async function collect<T>(iterator : AsyncIterableIterator<T>){
  const result : T[] = [];
  for await(const item of iterator){
    result.push(item);
  }
  return result
}