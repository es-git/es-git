import test from 'ava';

import { Type } from '@es-git/core'
import MemoryRepo from './index';

const repo = new MemoryRepo();

test('SaveRaw then loadRaw', async t => {
  const object = new Uint8Array(100);
  await repo.saveRaw('1234', object);
  const loaded = await repo.loadRaw('1234');
  t.is(loaded, object);
});