import test, { TestContext } from 'ava';
import { encode, decode } from '@es-git/core';

import pktLine from './pkt-line';

test('pktLine empty with newline', testPktLine, '', '0005\n');
test('pktLine with newline', testPktLine, 'hi', '0007hi\n');

function testPktLine(t : TestContext, input : string, expected : string) {
  t.is(decode(pktLine(encode(input))), expected);
}