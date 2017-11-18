import test from 'ava';
import nodeFetch, { Request, RequestInit, Response } from 'node-fetch';

import {
  decode
} from '@es-git/core';

import { fetch } from './index';

test('fetch refs', async t => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs = [
    '04859931d7cbee5dff2f0b5b95b9e2693a5241d1',
  ];
  const result = await fetch({
    url,
    fetch: fetchify(nodeFetch),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false)
  });
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
  const result = await fetch({
    url,
    fetch: fetchify(nodeFetch),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    depth: 1
  });
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
  t.deepEqual(result.shallow, [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
});

test.only('fetch unshallow refs', async t => {
  const url = 'https://github.com/es-git/test-pull.git';
  const localRefs : string[] = [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ];
  const result = await fetch({
    url,
    fetch: fetchify(nodeFetch),
    localRefs,
    refspec: 'refs/heads/fetch-test:refs/remotes/origin/fetch-test',
    hasObject: () => Promise.resolve(false),
    unshallow: true,
    shallows: [
      '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
    ]
  });
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
  t.deepEqual(result.unshallow, [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ]);
});

function fetchify(fetch : (url: string | Request, init?: RequestInit) => Promise<Response>){
  return async (url: string | Request, init?: RequestInit) => {
    if(init && init.body){
      init.body = Buffer.from(init.body as any)
    }
    return await fetch(url, init);
  };
}
