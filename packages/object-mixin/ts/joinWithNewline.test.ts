import joinWithNewline from "./joinWithNewline";

test('joinWithNewline', () => {
  const actual = joinWithNewline('some', 'thing');
  expect(actual).toEqual(new Uint8Array([115, 111, 109, 101, 10, 116, 104, 105, 110, 103]));
});

test('joinWithNewline special character', () => {
  const actual = joinWithNewline('ø');
  expect(actual).toEqual(new Uint8Array([195, 184]));
});
