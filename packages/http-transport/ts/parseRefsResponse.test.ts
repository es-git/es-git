import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs';

import parseRefsResponse from './parseRefsResponse';

test('wrong service', async t => {
  const response = await new Promise<string>(res => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8', (err, val) => res(val)));
  t.throws(() => [...parseRefsResponse(response, 'blablabla')], 'unknown response');
});

test(async t => {
  const response = await new Promise<string>(res => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8', (err, val) => res(val)));
  const result = [...parseRefsResponse(response, 'git-upload-pack')];
  t.snapshot(result);
});