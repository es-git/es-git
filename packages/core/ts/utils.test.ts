import test, { TestContext } from 'ava';
import { encode, decode, toHexChar } from './utils';

test('toHexChar 0', testToHexChar, 0, '0');
test('toHexChar 1', testToHexChar, 1, '1');
test('toHexChar 9', testToHexChar, 9, '9');
test('toHexChar a', testToHexChar, 10, 'a');
test('toHexChar f', testToHexChar, 15, 'f');

function testToHexChar(t : TestContext, input : number, expected : string) {
  t.is(String.fromCharCode(toHexChar(input)), expected);
}
