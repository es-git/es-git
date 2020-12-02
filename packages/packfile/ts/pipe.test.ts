import pipe from './pipe';

test('iterable', () => {
  const result = pipe([1,2,3]);
  expect(result.pipe).toBeTruthy();
  expect(result.map).toBeTruthy();
});

test('iterable', () => {
  const result = pipe([1,2,3]).map(c => [...c].reduce((a,b) => a+b, 0));
  expect(result).toBe(6);
});