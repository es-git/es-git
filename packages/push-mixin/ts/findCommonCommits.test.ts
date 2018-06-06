import test from 'ava';
import { parse } from '@es-git/ascii-graph-walker';

import findCommonCommits from './findCommonCommits';

test('No Remote', async t => {
  const walk = parse`
    a--b--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), []);
  t.is(local.count, 3);
  t.is(remote.count, 0);
});

test('No Local', async t => {
  const walk = parse`
    a--b--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), []);
  t.is(local.count, 0);
  t.is(remote.count, 0);
});

test('Remote = Local', async t => {
  const walk = parse`
    a--b--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('(*)'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'c'
  ]);
  t.is(local.count, 1);
  t.is(remote.count, 1);
});

test('Local ahead of Remote', async t => {
  const walk = parse`
    o--o--o--o--o--[a]--o--o--(b)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a'
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 4);
});

test('Local ahead of Remote1, Remote2 unrelated', async t => {
  const walk = parse`
    o--o--o--o--o--[a]--o--o--(b)

    o--o--o--o--o--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a'
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 4);
});

test('Remote ahead of Local', async t => {
  const walk = parse`
    o--o--o--o--o--(a)--o--o--[b]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a',
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 4);
});

test('Remote ahead of Local short history', async t => {
  const walk = parse`
    o--o--(a)--o--o--[b]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a',
  ]);
  t.is(local.count, 3);
  t.is(remote.count, 4);
});

test('Local longer than remote', async t => {
  const walk = parse`
    o--o--o--o--o--a--o--o--[b]
                    \
                     o--o--o--o--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a'
  ]);
  t.is(local.count, 6);
  t.is(remote.count, 6);
});

test('Remote longer than local', async t => {
  const walk = parse`
    o--o--o--o--o--a--o--o--o--o--[b]
                    \
                     o--o--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a'
  ]);
  t.is(local.count, 6);
  t.is(remote.count, 6);
});

test('Remote closest to merge', async t => {
  const walk = parse`
                     5--4--2
                    /       \
    o--o--o--o--o--b--[a]--3--(1)
  `;
  const local = walk('(*)');
  const remote = walk('[*]');
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a',
    'b'
  ]);
});

test('Local closest to merge', async t => {
  const walk = parse`
                     ------2---
                    /          \
    o--o--o--o--o--b--o--o--[a]--(1)
  `;
  const local = walk('(*)');
  const remote = walk('[*]');
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'a',
    'b',
  ]);
});

test('2 locals should not walk the same path twice', async t => {
  const walk = parse`
    o--o--o--o--(b)--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), []);
  t.is(local.count, 7);
  t.is(remote.count, 0);
});

test('2 remotes should not walk the same path twice', async t => {
  const walk = parse`
    o--o--o--o--o--o--o--o--(a)

    o--o--o--o--[b]--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), []);
  t.is(local.count, 9);
  t.is(remote.count, 7);
});

test('2 local and 2 remote', async t => {
  const walk = parse`
                      o--o--o--o--(a)
                     /
    o--o--o--[d]--(b)--o--o--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  t.deepEqual(result.map(c => c.hash), [
    'd',
    'b',
  ]);
  t.is(local.count, 8);
  t.is(remote.count, 8);
});

function count<T>(iterable : AsyncIterableIterator<T>){
  return {
    ...iterable,
    count: 0,
    async next(value? : any){
      const result = await iterable.next(value);
      this.count += result.done ? 0 : 1;
      return result;
    }
  }
}