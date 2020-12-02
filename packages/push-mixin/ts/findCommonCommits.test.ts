import { parse } from '@es-git/ascii-graph-walker';
import findCommonCommits from './findCommonCommits';


test('No Remote', async () => {
  const walk = parse`
    a--b--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([]);
  expect(local.count).toBe(3);
  expect(remote.count).toBe(0);
});

test('No Local', async () => {
  const walk = parse`
    a--b--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([]);
  expect(local.count).toBe(0);
  expect(remote.count).toBe(0);
});

test('Remote = Local', async () => {
  const walk = parse`
    a--b--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('(*)'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'c'
  ]);
  expect(local.count).toBe(1);
  expect(remote.count).toBe(1);
});

test('Local ahead of Remote', async () => {
  const walk = parse`
    o--o--o--o--o--[a]--o--o--(b)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a'
  ]);
  expect(local.count).toBe(4);
  expect(remote.count).toBe(4);
});

test('Local ahead of Remote1, Remote2 unrelated', async () => {
  const walk = parse`
    o--o--o--o--o--[a]--o--o--(b)

    o--o--o--o--o--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a'
  ]);
  expect(local.count).toBe(4);
  expect(remote.count).toBe(4);
});

test('Remote ahead of Local', async () => {
  const walk = parse`
    o--o--o--o--o--(a)--o--o--[b]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a',
  ]);
  expect(local.count).toBe(4);
  expect(remote.count).toBe(4);
});

test('Remote ahead of Local short history', async () => {
  const walk = parse`
    o--o--(a)--o--o--[b]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a',
  ]);
  expect(local.count).toBe(3);
  expect(remote.count).toBe(4);
});

test('Local longer than remote', async () => {
  const walk = parse`
    o--o--o--o--o--a--o--o--[b]
                    \
                     o--o--o--o--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a'
  ]);
  expect(local.count).toBe(6);
  expect(remote.count).toBe(6);
});

test('Remote longer than local', async () => {
  const walk = parse`
    o--o--o--o--o--a--o--o--o--o--[b]
                    \
                     o--o--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a'
  ]);
  expect(local.count).toBe(6);
  expect(remote.count).toBe(6);
});

test('Remote closest to merge', async () => {
  const walk = parse`
                     5--4--2
                    /       \
    o--o--o--o--o--b--[a]--3--(1)
  `;
  const local = walk('(*)');
  const remote = walk('[*]');
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a',
    'b'
  ]);
});

test('Local closest to merge', async () => {
  const walk = parse`
                     ------2---
                    /          \
    o--o--o--o--o--b--o--o--[a]--(1)
  `;
  const local = walk('(*)');
  const remote = walk('[*]');
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'a',
    'b',
  ]);
});

test('2 locals should not walk the same path twice', async () => {
  const walk = parse`
    o--o--o--o--(b)--(c)
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([]);
  expect(local.count).toBe(7);
  expect(remote.count).toBe(0);
});

test('2 remotes should not walk the same path twice', async () => {
  const walk = parse`
    o--o--o--o--o--o--o--o--(a)

    o--o--o--o--[b]--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([]);
  expect(local.count).toBe(9);
  expect(remote.count).toBe(7);
});

test('2 local and 2 remote', async () => {
  const walk = parse`
                      o--o--o--o--(a)
                     /
    o--o--o--[d]--(b)--o--o--[c]
  `;
  const local = count(walk('(*)'));
  const remote = count(walk('[*]'));
  const result = await findCommonCommits(local, remote);
  expect(result.map(c => c.hash)).toEqual([
    'd',
    'b',
  ]);
  expect(local.count).toBe(8);
  expect(remote.count).toBe(8);
});

function count<T>(iterator : AsyncGenerator<T>) : AsyncGenerator<T> & {count: number} {
  const oldNext = iterator.next;

  const newIterator = iterator as AsyncGenerator<T> & { count: number; };

  newIterator.count = 0;
  newIterator.next = async (value?: any) => {
    const result = await oldNext.call(newIterator, value);
    newIterator.count += result.done ? 0 : 1;
    return result;
  }

  return newIterator;
}
