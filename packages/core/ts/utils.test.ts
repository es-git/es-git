import test, { TestContext } from 'ava';
import { encode, decode, toHexChar } from './utils';
import { isFile, Mode } from './index';

test('toHexChar 0', testToHexChar, 0, '0');
test('toHexChar 1', testToHexChar, 1, '1');
test('toHexChar 9', testToHexChar, 9, '9');
test('toHexChar a', testToHexChar, 10, 'a');
test('toHexChar f', testToHexChar, 15, 'f');

function testToHexChar(t : TestContext, input : number, expected : string) {
  t.is(String.fromCharCode(toHexChar(input)), expected);
}

test('isFile blob', t => {
  t.true(isFile(Mode.blob));
});

test('isFile file', t => {
  t.true(isFile(Mode.file));
});

test('isFile exec', t => {
  t.true(isFile(Mode.exec));
});

test('isFile tree', t => {
  t.false(isFile(Mode.tree));
});

test('isFile commit', t => {
  t.false(isFile(Mode.commit));
});