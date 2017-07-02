import test from 'ava';

import { Types, RawObject } from '@es-git/core'
import MemoryRepo from './index';

const repo = new MemoryRepo();

test('SaveRaw then loadRaw', async t => {
  const object : RawObject = {hash: '1234', type: Types.blob, body : new Uint8Array(100)};
  const hash = await repo.saveRaw(object);
  const loaded = await repo.loadRaw('1234');
  t.is(loaded, object);
});