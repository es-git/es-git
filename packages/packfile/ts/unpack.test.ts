import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';

import unpack from './unpack';
import pipe from './pipe';

test('unpack sample1', async t => {
  const pack = await promisify(fs.readFile)(__dirname + '/../samples/sample1.pack');
  const entries = await pipe(stream(pack))
    .pipe(unpack)
    .then(collect);

  t.snapshot(entries);
  t.is(entries.length, 2651);
});

test('unpack sample2', async t => {
  const pack = await promisify(fs.readFile)(__dirname + '/../samples/sample2.pack');
  const entries = await pipe(stream(pack))
    .pipe(unpack)
    .then(collect);

  t.snapshot(entries);
  t.is(entries.length, 3);
});

async function* stream(item : Buffer) : AsyncIterableIterator<Uint8Array> {
  yield toUint8Array(item);
}

async function collect<T>(iterator : AsyncIterableIterator<T>){
  const result : T[] = [];
  for await(const item of iterator){
    result.push(item);
  }
  return result
}

function toUint8Array(value : Buffer){
  return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
}