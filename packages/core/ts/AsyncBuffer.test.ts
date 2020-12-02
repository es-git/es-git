import AsyncBuffer from './AsyncBuffer';

test('next()', async () => {
  const buffer = new AsyncBuffer(generate());
  expect(await buffer.next()).toBe(1);
  expect(await buffer.next()).toBe(2);
  expect(await buffer.next()).toBe(3);
  expect(await buffer.next()).toBe(4);
  expect(await buffer.next()).toBe(5);
});

test('next(1)', async () => {
  const buffer = new AsyncBuffer(generate());
  expect((await buffer.next(1))[0]).toBe(1);
  expect((await buffer.next(1))[0]).toBe(2);
  expect((await buffer.next(1))[0]).toBe(3);
  expect((await buffer.next(1))[0]).toBe(4);
  expect((await buffer.next(1))[0]).toBe(5);
});

test('next(12)', async () => {
  const buffer = new AsyncBuffer(generate());
  const result1 = await buffer.next(12);
  const result2 = await buffer.next(12);
  expect(result1.join(',')).toBe('1,2,3,4,5,1,2,3,4,5,1,2');
  expect(buffer.pos).toBe(24);
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