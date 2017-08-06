import test from 'ava';

import Buffer from './Buffer';

test('next()', t => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  t.is(buffer.next(), 0);
  t.is(buffer.next(), 1);
  t.is(buffer.next(), 2);
  t.is(buffer.next(), 3);
  t.is(buffer.next(), 4);
});

test('next(1)', t => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  t.is(buffer.next(1)[0], 0);
  t.is(buffer.next(1)[0], 1);
  t.is(buffer.next(1)[0], 2);
  t.is(buffer.next(1)[0], 3);
  t.is(buffer.next(1)[0], 4);
});

test('next(2)', t => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  t.is(buffer.next(2).join(','), '0,1');
  t.is(buffer.next(2).join(','), '2,3');
  t.is(buffer.next(2).join(','), '4');
});

test('rest', t => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  buffer.next(2);
  t.is(buffer.rest().join(','), '2,3,4');
});

test('soFar', t => {
  const buffer = new Buffer(new Uint8Array([0, 1, 2, 3, 4]));
  buffer.next(2);
  buffer.next(1);
  t.is(buffer.soFar().join(','), '0,1,2');
});

test('write(1)', t => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(0);
  buffer.write(1);
  buffer.write(2);
  t.is(buffer.soFar().join(','), '0,1,2');
});

test('write([0,1,2])', t => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(new Uint8Array([0, 1, 2]));
  t.is(buffer.soFar().join(','), '0,1,2');
});

test('write([0,1,2,3,4], 1, 3)', t => {
  const buffer = new Buffer(new Uint8Array(4));
  buffer.write(new Uint8Array([0, 1, 2, 3, 4]), 1, 3);
  t.is(buffer.soFar().join(','), '1,2,3');
});