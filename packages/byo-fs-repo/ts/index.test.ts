import test from 'ava';

import index from './index';

test('blob is blob', t => {
  t.is(typeof index, 'function');
})