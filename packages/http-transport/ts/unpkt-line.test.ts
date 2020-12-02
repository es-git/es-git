import unpktLine, { fromHex } from './unpkt-line';

test.each([
  ['0000', 0],
  ['0001', 1],
  ['000f', 15],
  ['0010', 16],
])('fromHex %s', (input, expected) => {
  expect(fromHex(input)).toBe(expected);
})

test.each([
  ['unpktLine empty with newline', '0005\n', ['', '']],
  ['unpktLine empty without newline', '0004', ['', '']],
  ['unpktLine with newline', '0007hi\n', ['hi', '']],
  ['unpktLine without newline', '0006hi', ['hi', '']],
  ['unpktLine more with newline', '0007hi\nmore', ['hi', 'more']],
  ['unpktLine more without newline', '0006himore', ['hi', 'more']],
  ['unpktLine 0000', '0000', ['', '']],
])('%s', (_, input, expected) => {
  const [line, tail] = unpktLine(input);
  expect(line).toBe(expected[0]);
  expect(tail).toBe(expected[1]);
});
