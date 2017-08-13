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
  const wantedRefs : string[] = [
    '3fb4a14c56fbe289d336b3a1cae44518fe736f50'
  ];
  const result = await fetch(url, fetchify(nodeFetch), localRefs, ['refs/heads/fetch-test:refs/remotes/origin/fetch-test'], () => Promise.resolve(false));
  t.deepEqual(result.refs, [
    {
      hash: '3fb4a14c56fbe289d336b3a1cae44518fe736f50',
      name: 'refs/remotes/origin/fetch-test'
    }
  ]);
});

function fetchify(fetch : (url: string | Request, init?: RequestInit) => Promise<Response>){
  return async (url: string | Request, init?: RequestInit) => {
    if(init && init.body){
      init.body = Buffer.from(init.body as any)
    }
    const response = await fetch(url, init);
    return {
      arrayBuffer: async () => {
        const buf = await response.buffer();
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      },
      text: () => response.text(),
      status: response.status,
      statusText: response.statusText
    };
  };
}