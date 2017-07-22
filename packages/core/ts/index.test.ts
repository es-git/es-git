import test from 'ava';

import { isBlob, Mode } from './index';

test('blob is blob', t => {
  t.true(isBlob(Mode.blob));
})