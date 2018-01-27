import test from 'ava';

import pipe from './pipe';

test('iterable', t => {
  const result = pipe([1,2,3]);
  t.truthy(result.pipe);
  t.truthy(result.map);
});

test('iterable', t => {
  const result = pipe([1,2,3]).map(c => [...c].reduce((a,b) => a+b, 0));
  t.is(result, 6);
});