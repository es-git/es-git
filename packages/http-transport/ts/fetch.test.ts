import test from 'ava';
import nodeFetch, { Request, Response, RequestInit } from 'node-fetch';
import * as fs from 'fs';
import { concat } from '@es-git/core';

import fetch, { Fetch, FetchRequest, RawObject } from './fetch';
import streamToAsyncIterator from './utils/streamToAsyncIterator';
import { Ref } from './types';

test('fetch refs', async t => {
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
  }, s => console.log(s));

  t.snapshot(await toArray(result.objects));
  t.deepEqual(await result.shallow, []);
  t.deepEqual(await result.unshallow, []);
  t.deepEqual(result.refs, [
    {
      oldHash: '04859931d7cbee5dff2f0b5b95b9e2693a5241d1',
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
});

test('fetch shallow refs', async t => {
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
  }, s => console.log(s));
  t.snapshot(await toArray(result.objects));
  t.deepEqual(result.refs, [
    {
      oldHash: undefined,
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
  }, s => console.log(s));
  t.snapshot(await toArray(result.objects));
  t.deepEqual(result.refs, []);
  t.deepEqual(await result.shallow, []);
  t.deepEqual(await result.unshallow, [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
});

test('fetch sha1 refs', async t => {
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
  }, s => console.log(s));
  t.snapshot(await toArray(result.objects));
  t.deepEqual(result.refs, [{
    name: undefined,
    oldHash: undefined,
    hash: 'a8cf377bea61e300d3d7ab259340358187f103a9'
  }]);
  t.deepEqual(await result.shallow, [
    'a8cf377bea61e300d3d7ab259340358187f103a9'
  ]);
  t.deepEqual(await result.unshallow, []);
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

function save(paths : string[]){
  return async (r : NodeJS.ReadableStream) =>
    new Promise<void>((res, rej) => r.pipe(fs.createWriteStream(paths.shift() as string)).on('finish', res).on('error', rej));
}

function fetchify(fetch : (url: string | Request, init?: RequestInit) => Promise<Response>, onResponse : (stream : NodeJS.ReadableStream) => Promise<void>){
  return async (url: string | Request, init?: RequestInit) => {
    if(init && init.body){
      init.body = Buffer.from(init.body as any)
    }
    const response = await fetch(url, init);
    console.log(url);
    const res = await onResponse(response.clone().body);
    console.log('done', res);
    return response;
  };
}
