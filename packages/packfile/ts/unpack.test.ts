import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';

import unpack from './unpack';

test('unpack sample', async t => {
  const pack = await promisify(fs.readFile)(__dirname + '/../samples/sample1.pack');
  const entries = [];
  for(const entry of unpack(new Uint8Array(pack))){
    entries.push(entry);
  }
  t.is(entries.length, 2651);
});