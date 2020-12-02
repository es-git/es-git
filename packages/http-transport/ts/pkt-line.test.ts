import { decode, encode } from '@es-git/core';
import pktLine from './pkt-line';


test.each([
['', '0005\n', 'pktLine empty with newline'],
['hi', '0007hi\n', 'pktLine with newline'],
])('%s', (input, expected) => {
  expect(decode(pktLine(encode(input)))).toBe(expected);
});