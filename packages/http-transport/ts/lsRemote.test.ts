import test from 'ava';
import * as sinon from 'sinon';
import * as fs from 'fs';

import lsRemote from './lsRemote';

test('error response', async t => {
  const fetch = sinon.stub();
  fetch.resolves({
    text: () => Promise.resolve('Repo not found'),
    status: 401,
    statusText: 'Unauthorized'
  });
  await t.throws(lsRemote('https://github.com/my/repo.git', fetch), 'ls-remote failed with 401 Unauthorized\nRepo not found');
});

test(async t => {
  const fetch = sinon.stub();
  fetch.resolves({
    text: () => new Promise(res => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8', (err, val) => res(val))),
    status: 200,
    statusText: 'OK'
  });
  const result = await lsRemote('https://github.com/my/repo.git', fetch);
  t.is(fetch.firstCall.args[0], 'https://github.com/my/repo.git/info/refs?service=git-upload-pack');
  t.snapshot(result);
});