import * as fs from 'fs';
import fetch, { Fetch } from './fetch';
import { Ref } from './types';


const log = () => {};//console.log;

test('fetch refs', async () => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    {
      name: 'refs/remotes/origin/fetch-test',
      hash: '04859931d7cbee5dff2f0b5b95b9e2693a5241d1'
    },
  ];

  const result = await fetch({
    url,
    //fetch: fetchify(nodeFetch, save([
    fetch: fakeFetch(([
      __dirname+'/../samples/fetch-refs.get',
      __dirname+'/../samples/fetch-refs.post'
    ])),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false)
  }, log);

  expect(await toArray(result.objects)).toMatchSnapshot();
  expect(await result.shallow).toEqual([]);
  expect(await result.unshallow).toEqual([]);
  expect(result.refs).toEqual([
    {
      oldHash: '04859931d7cbee5dff2f0b5b95b9e2693a5241d1',
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
});

test('fetch shallow refs', async () => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs : Ref[] = [];

  const result = await fetch({
    url,
    //fetch: fetchify(nodeFetch, save([
    fetch: fakeFetch(([
      __dirname+'/../samples/fetch-shallow-refs.get',
      __dirname+'/../samples/fetch-shallow-refs.post'
    ])),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    depth: 1
  }, log);
  expect(await toArray(result.objects)).toMatchSnapshot();
  expect(result.refs).toEqual([
    {
      oldHash: undefined,
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
  expect(await result.shallow).toEqual([
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
  expect(await result.unshallow).toEqual([]);
});

test('fetch unshallow refs', async () => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    {
      name: 'refs/remotes/origin/fetch-test',
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
    }
  ];

  const result = await fetch({
    url,
    //fetch: fetchify(nodeFetch, save([
    fetch: fakeFetch(([
      __dirname+'/../samples/fetch-unshallow-refs.get',
      __dirname+'/../samples/fetch-unshallow-refs.post'
    ])),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    unshallow: true,
    shallows: [
      '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
    ]
  }, log);
  expect(await toArray(result.objects)).toMatchSnapshot();
  expect(result.refs).toEqual([]);
  expect(await result.shallow).toEqual([]);
  expect(await result.unshallow).toEqual([
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
});

test('fetch sha1 refs', async () => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    {
      name: 'refs/remotes/origin/fetch-test',
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
    }
  ];

  const result = await fetch({
    url,
    //fetch: fetchify(nodeFetch, save([
    fetch: fakeFetch(([
      __dirname+'/../samples/fetch-sha1-refs.get',
      __dirname+'/../samples/fetch-sha1-refs.post'
    ])),
    localRefs,
    refspec: 'a8cf377bea61e300d3d7ab259340358187f103a9',
    hasObject: () => Promise.resolve(false),
    depth: 1
  }, log);
  expect(await toArray(result.objects)).toMatchSnapshot();
  expect(result.refs).toEqual([{
    name: undefined,
    oldHash: undefined,
    hash: 'a8cf377bea61e300d3d7ab259340358187f103a9'
  }]);
  expect(await result.shallow).toEqual([
    'a8cf377bea61e300d3d7ab259340358187f103a9'
  ]);
  expect(await result.unshallow).toEqual([]);
});

function fakeFetch(paths : string[]) : Fetch {
  const response = {
    status: 200,
    statusText: 'OK',
    text: () => new Promise<string>(res => fs.readFile(paths[0], 'utf8', (err, val) => res(val))),
    body: fs.createReadStream(paths[1])
  };
  return async () => {
    return response;
  }
}

async function toArray<T>(stream : AsyncIterableIterator<T>){
  const array : T[] = [];
  for await(const chunk of stream){
    array.push(chunk);
  }
  return array;
}



