import Buffer from './Buffer';

test('next()', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  expect(buffer.next()).toBe(0);
  expect(buffer.next()).toBe(1);
  expect(buffer.next()).toBe(2);
  expect(buffer.next()).toBe(3);
  expect(buffer.next()).toBe(4);
});

test('next(1)', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  expect(buffer.next(1)[0]).toBe(0);
  expect(buffer.next(1)[0]).toBe(1);
  expect(buffer.next(1)[0]).toBe(2);
  expect(buffer.next(1)[0]).toBe(3);
  expect(buffer.next(1)[0]).toBe(4);
});

test('copy buffer', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  buffer.next(2);
  const buffer2 = new Buffer(buffer.rest());
  expect(buffer2.next(1)[0]).toBe(2);
});

test('next(2)', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  expect(buffer.next(2).join(',')).toBe('0,1');
  expect(buffer.next(2).join(',')).toBe('2,3');
  expect(buffer.next(2).join(',')).toBe('4');
});

test('rest', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  buffer.next(2);
  expect(buffer.rest().join(',')).toBe('2,3,4');
});

test('soFar', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  buffer.next(2);
  buffer.next(1);
  expect(buffer.soFar().join(',')).toBe('0,1,2');
});

test('write(1)', () => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(0);
  buffer.write(1);
  buffer.write(2);
  expect(buffer.soFar().join(',')).toBe('0,1,2');
});

test('write([0,1,2])', () => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(new Uint8Array([0, 1, 2]));
  expect(buffer.soFar().join(',')).toBe('0,1,2');
});

test('write([0,1,2,3,4], 1, 3)', () => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(new Uint8Array([0, 1, 2, 3, 4]), 1, 3);
  expect(buffer.soFar().join(',')).toBe('1,2,3');
});

test('peek()', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  expect(buffer.peek()).toBe(0);
  expect(buffer.peek()).toBe(0);
  expect(buffer.peek()).toBe(0);
  expect(buffer.peek()).toBe(0);
  expect(buffer.peek()).toBe(0);
});

test('peek(1)', () => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  expect(buffer.peek(1)[0]).toBe(0);
  expect(buffer.peek(1)[0]).toBe(0);
  expect(buffer.peek(1)[0]).toBe(0);
  expect(buffer.peek(1)[0]).toBe(0);
  expect(buffer.peek(1)[0]).toBe(0);
});

test('peekInt32()', () => {
  const buffer = new Buffer(new Uint8Array([0x50, 0x41, 0x43, 0x4b]));
  expect(buffer.peekInt32()).toBe(0x5041434b);
});