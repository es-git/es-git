import test from 'ava';
import * as fs from 'fs';
import { promisify } from 'util';

import unpack from './unpack';
import normalizeEntries from './normalize-entries';
import { Type, OfsDeltaEntry, Entry } from './types';

test('unpack sample', async t => {
  const pack = await promisify(fs.readFile)(__dirname + '/../samples/sample1.pack');
  const entries = [...normalizeEntries(unpack(new Uint8Array(pack)))];

  //t.snapshot(decoder.decode(entries[2120].body));
  t.is(entries.length, 2651);
});