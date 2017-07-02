import test from 'ava';

import { isBlob, Modes } from './index';

test('blob is blob', t => {
  t.true(isBlob(Modes.blob));
})