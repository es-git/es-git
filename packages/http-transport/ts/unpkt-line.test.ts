import test, { TestContext } from 'ava';
import unpktLine, { fromHex } from './unpkt-line';

test('fromHex 0000', testFromHex, '0000', 0);
test('fromHex 0001', testFromHex, '0001', 1);
test('fromHex 000f', testFromHex, '000f', 15);
test('fromHex 0010', testFromHex, '0010', 16);

test('unpktLine empty with newline', testUnpktLine, '0005\n', ['', '']);
test('unpktLine empty without newline', testUnpktLine, '0004', ['', '']);
test('unpktLine with newline', testUnpktLine, '0007hi\n', ['hi', '']);
test('unpktLine without newline', testUnpktLine, '0006hi', ['hi', '']);
test('unpktLine more with newline', testUnpktLine, '0007hi\nmore', ['hi', 'more']);
test('unpktLine more without newline', testUnpktLine, '0006himore', ['hi', 'more']);
test('unpktLine 0000', testUnpktLine, '0000', ['', '']);

function testFromHex(t : TestContext, input : string, expected : number) {
  t.is(fromHex(input), expected);
}

function testUnpktLine(t : TestContext, input : string, expected : [string, string]) {
  const [line, tail] = unpktLine(input);
  t.is(line, expected[0]);
  t.is(tail, expected[1]);
}