import test from 'ava';

import AsyncBuffer from './AsyncBuffer';

test('next()', async t => {
  const buffer = new AsyncBuffer(generate());
  t.is(await buffer.next(), 1);
  t.is(await buffer.next(), 2);
  t.is(await buffer.next(), 3);
  t.is(await buffer.next(), 4);
  t.is(await buffer.next(), 5);
});

test('next(1)', async t => {
  const buffer = new AsyncBuffer(generate());
  t.is((await buffer.next(1))[0], 1);
  t.is((await buffer.next(1))[0], 2);
  t.is((await buffer.next(1))[0], 3);
  t.is((await buffer.next(1))[0], 4);
  t.is((await buffer.next(1))[0], 5);
});

test('next(12)', async t => {
  const buffer = new AsyncBuffer(generate());
  const result1 = await buffer.next(12);
  const result2 = await buffer.next(12);
  t.is(result1.join(','), '1,2,3,4,5');
  t.is(buffer.pos, 24);
  await buffer.next(6);
});

async function *generate(){
  yield new Uint8Array([1,2,3,4,5]);
  yield new Uint8Array([1,2,3,4,5]);
  yield new Uint8Array([1,2,3,4,5]);
  yield new Uint8Array([1,2,3,4,5]);
  yield new Uint8Array([1,2,3,4,5]);
  yield new Uint8Array([1,2,3,4,5]);
}