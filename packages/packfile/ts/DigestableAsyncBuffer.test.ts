import test from 'ava';
import * as fs from 'fs';

import DigestableAsyncBuffer from './DigestableAsyncBuffer';

test('digest async buffer', async t => {
  const pack = fs.readFileSync(__dirname + '/../samples/sample2.pack');
  const buffer = new DigestableAsyncBuffer(gen(toUint8Array(pack)));
  const length = 277;
  await buffer.nextInt32();
  await buffer.nextInt32();
  await buffer.nextInt32();
  await buffer.next();
  await buffer.next();
  await buffer.next(159);
  await buffer.next();
  await buffer.next(22);
  await buffer.next();
  await buffer.next();
  await buffer.next(length - buffer.pos);
  t.is(buffer.digest(), '39f21cd1d568778a963bbbe0040445c627ed52cd');
});

async function* gen<T>(item : T) : AsyncIterableIterator<T> {
  yield item;
}

function toUint8Array(value : Buffer){
  return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
}