import { promises as fs } from 'fs';
import * as sinon from 'sinon';
import lsRemote from './lsRemote';


test('error response', async () => {
  const fetch = sinon.stub();
  fetch.resolves({
    text: () => Promise.resolve('Repo not found'),
    status: 401,
    statusText: 'Unauthorized'
  });
  await expect(lsRemote('https://github.com/my/repo.git', fetch)).rejects.toThrowError('ls-remote failed with 401 Unauthorized\nRepo not found');
});

test('lsRemote', async () => {
  const fetch = sinon.stub();
  fetch.resolves({
    text: () => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8'),
    status: 200,
    statusText: 'OK'
  });
  const result = await lsRemote('https://github.com/my/repo.git', fetch);
  expect(fetch.firstCall.args[0]).toBe('https://github.com/my/repo.git/info/refs?service=git-upload-pack');
  expect(result).toMatchSnapshot();
});
