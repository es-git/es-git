import test from 'ava';
import nodeFetch, { Request, RequestInit, Response } from 'node-fetch';
import * as fs from 'fs';
import { concat } from '@es-git/core';

import fetch, { Fetch, RawObject } from './fetch';

test('fetch refs', async t => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    '04859931d7cbee5dff2f0b5b95b9e2693a5241d1',
  ];

  const result = await fetch({
    url,
    fetch: fakeFetch([
      __dirname+'/../samples/fetch-refs.get',
      __dirname+'/../samples/fetch-refs.post'
    ]),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false)
  });

  t.snapshot(await toArray(result.objects));
  t.deepEqual(await result.shallow, []);
  t.deepEqual(await result.unshallow, []);
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
});

test('fetch shallow refs', async t => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs : string[] = [];

  const paths = [
    __dirname+'/../samples/fetch-shallow-refs.get',
    __dirname+'/../samples/fetch-shallow-refs.post'
  ];

  const result = await fetch({
    url,
    //fetch: fetchify(nodeFetch, r => r.pipe(fs.createWriteStream(paths.shift() as string))),
    fetch: fakeFetch([
      __dirname+'/../samples/fetch-shallow-refs.get',
      __dirname+'/../samples/fetch-shallow-refs.post'
    ]),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    depth: 1
  });
  t.snapshot(await toArray(result.objects));
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
  t.deepEqual(await result.shallow, [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
  t.deepEqual(await result.unshallow, []);
});

test('fetch unshallow refs', async t => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ];

  const result = await fetch({
    url,
    fetch: fakeFetch([
      __dirname+'/../samples/fetch-unshallow-refs.get',
      __dirname+'/../samples/fetch-unshallow-refs.post'
    ]),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    unshallow: true,
    shallows: [
      '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
    ]
  });
  t.snapshot(await toArray(result.objects));
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
  t.deepEqual(await result.shallow, []);
  t.deepEqual(await result.unshallow, [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
});

function fakeFetch(paths : string[]) : Fetch {
  const response = {
    status: 200,
    statusText: 'OK',
    text: () => new Promise<string>(res => fs.readFile(paths[0], 'utf8', (err, val) => res(val))),
    body: fs.createReadStream(paths[1])
  };
  return async (url : string, init? : RequestInit) => {
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

function fetchify(fetch : (url: string | Request, init?: RequestInit) => Promise<Response>, onResponse : (stream : NodeJS.ReadableStream) => void){
  return async (url: string | Request, init?: RequestInit) => {
    if(init && init.body){
      init.body = Buffer.from(init.body as any)
    }
    const response = await fetch(url, init);
    onResponse(response.clone().body);
    return response;
  };
}