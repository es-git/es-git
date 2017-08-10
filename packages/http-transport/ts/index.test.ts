import test from 'ava';
import fetch from 'node-fetch';

import {
  decode
} from '@es-git/core';

import { fetch as gitFetch } from './index';

test('fetch refs', async t => {
  const url = 'https://github.com/creationix/js-git.git';
  const localRefs = [
    '03ea444e55f468d7270e77196701da5350a67c50',
  ];
  const wantedRefs : string[] = [
    '40b3732b3b1fc87e625b107cd55c68cd1ba4470f',
    '0e76e6214dbba347a4f24497261a1bd71aac8347'
  ];
  const result = await gitFetch(url, fetch, localRefs, ['refs/heads/*:refs/remotes/origin/*'], () => Promise.resolve(false));
  console.log(result.refs);
  t.pass();
});
