import { isFile, Mode } from './index';
import { decode, encode, toHexChar } from './utils';

test.each([
  [0, '0'],
  [1, '1'],
  [9, '9'],
  [10, 'a'],
  [15, 'f'],
])('toHexChar(%d) == %s', (input, expected) => {
  expect(String.fromCharCode(toHexChar(input))).toBe(expected);
})

test('isFile blob', () => {
  expect(isFile(Mode.blob)).toBe(true);
});

test('isFile file', () => {
  expect(isFile(Mode.file)).toBe(true);
});

test('isFile exec', () => {
  expect(isFile(Mode.exec)).toBe(true);
});

test('isFile tree', () => {
  expect(isFile(Mode.tree)).toBe(false);
});

test('isFile commit', () => {
  expect(isFile(Mode.commit)).toBe(false);
});

test('encode', () => {
  expect(encode('')).toBeInstanceOf(Uint8Array);
});

test('decode', () => {
  expect(decode(new Uint8Array([32,32,32,32]))).toBe('    ');
});
