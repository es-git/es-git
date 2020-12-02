import * as fs from 'fs';

import parseRefsResponse from './parseRefsResponse';

test('wrong service', async () => {
  const response = await new Promise<string>(res => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8', (err, val) => res(val)));
  expect(() => [...parseRefsResponse(response, 'blablabla')]).toThrowError(
    'unknown response "# service=git-upload-pack", expected "# service=blablabla"'
  );
});

test('', async () => {
  const response = await new Promise<string>(res => fs.readFile(__dirname+'/../samples/lsremote.txt', 'utf8', (err, val) => res(val)));
  const result = [...parseRefsResponse(response, 'git-upload-pack')];
  expect(result).toMatchSnapshot();
});