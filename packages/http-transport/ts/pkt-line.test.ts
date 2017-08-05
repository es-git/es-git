import test, { TestContext } from 'ava';
import { TextEncoder, TextDecoder } from 'text-encoding';

import pktLine, { toHexChar } from './pkt-line';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test('toHexChar 0', testToHexChar, 0, '0');
test('toHexChar 1', testToHexChar, 1, '1');
test('toHexChar 9', testToHexChar, 9, '9');
test('toHexChar a', testToHexChar, 10, 'a');
test('toHexChar f', testToHexChar, 15, 'f');

test('pktLine empty with newline', testPktLine, '', '0005\n');
test('pktLine with newline', testPktLine, 'hi', '0007hi\n');

function testToHexChar(t : TestContext, input : number, expected : string) {
  t.is(String.fromCharCode(toHexChar(input)), expected);
}

function testPktLine(t : TestContext, input : string, expected : string) {
  t.is(decoder.decode(pktLine(encoder.encode(input))), expected);
}