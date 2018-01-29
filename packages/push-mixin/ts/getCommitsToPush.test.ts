import test from 'ava';
import walk, { parse } from '@es-git/ascii-graph-walker';

import getCommitsToPush, {zip, HashAndCommit} from './getCommitsToPush';

test('zip', async t => {
  const result = await toArray(zip(stream(ofLength(10)).iterable(), stream(ofLength(5)).iterable()));
  t.deepEqual(result, [
    [0,0],
    [1,1],
    [2,2],
    [3,3],
    [4,4],
    [5,undefined],
    [6,undefined],
    [7,undefined],
    [8,undefined],
    [9,undefined]
  ]);
});

test('No Remote', async t => {
  const walk = parse`a--b--(c)`;
  const local = walk(dummyCommit, '()');
  const remote = walk(dummyCommit, '[]');
  const result = await getCommitsToPush(local, remote);
  t.deepEqual(result.localCommits, [
    {hash:'c', commit: {}},
    {hash:'b', commit: {}},
    {hash:'a', commit: {}}
  ]);
  t.deepEqual(result.commonCommits, []);
});

test('Remote = Local', async t => {
  const local = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  const remote = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, []);
  t.deepEqual(result.commonCommits, [
    {hash:'aaa', commit: {}}
  ]);
  t.is(local.count, 1);
  t.is(remote.count, 1);
});

test('Local ahead of Remote', async t => {
  const local = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const remote = stream([
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, [
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}}
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 4);
});

test('Local ahead of Remote1, Remote2 unrelated', async t => {
  const local = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const remote1 = stream([
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const remote2 = stream([
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
    {hash:'333', commit: {}},
    {hash:'444', commit: {}},
    {hash:'555', commit: {}},
    {hash:'666', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote1.iterable(), remote2.iterable());
  t.deepEqual(result.localCommits, [
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}}
  ]);
  t.is(local.count, 4);
  t.is(remote1.count, 4);
  t.is(remote2.count, 4);
});

test('Remote ahead of Local', async t => {
  const local = stream([
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const remote = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, []);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}},
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 7);
});

test('Remote ahead of Local short history', async t => {
  const local = stream([
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
  ]);
  const remote = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, []);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}},
  ]);
  t.is(local.count, 3);
  t.is(remote.count, 6);
});

test('Local longer than remote', async t => {
  const local = stream([
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
    {hash:'333', commit: {}},
    {hash:'444', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}}
  ]);
  const remote = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, [
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
    {hash:'333', commit: {}},
    {hash:'444', commit: {}},
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}}
  ]);
  t.is(local.count, 5);
  t.is(remote.count, 5);
});

test('Remote longer than local', async t => {
  const local = stream([
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}}
  ]);
  const remote = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}},
    {hash:'ddd', commit: {}},
    {hash:'eee', commit: {}},
    {hash:'fff', commit: {}},
    {hash:'ggg', commit: {}},
    {hash:'hhh', commit: {}},
    {hash:'iii', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result.localCommits, [
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'ddd', commit: {}}
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 5);
});

test('Remote closest to merge', async t => {
  const walk = parse`
                   5--4--2
                  /       \
  o--o--o--o--o--b--[a]--3--(1)
  `;

  const local = walk(dummyCommit, '()');
  const remote = walk(dummyCommit, '[]');
  const result = await getCommitsToPush(local, remote);
  t.deepEqual(result.localCommits, [
    {hash:'1', commit: {}},
    {hash:'2', commit: {}},
    {hash:'3', commit: {}},
    {hash:'4', commit: {}},
    {hash:'5', commit: {}},
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'a', commit: {}},
    {hash:'b', commit: {}}
  ]);
});
test('Local closest to merge', async t => {
  const walk = parse`
                   ------2---
                  /          \
  o--o--o--o--o--b--o--o--[a]--(1)
  `;
  const local = walk(dummyCommit, '()');
  const remote = walk(dummyCommit, '[]');
  const result = await getCommitsToPush(local, remote);
  t.deepEqual(result.localCommits, [
    {hash:'1', commit: {}},
    {hash:'2', commit: {}},
  ]);
  t.deepEqual(result.commonCommits, [
    {hash:'a', commit: {}},
    {hash:'b', commit: {}},
  ]);
});

async function toArray<T>(stream : AsyncIterableIterator<T>){
  const result = [];
  for await(const item of stream){
    result.push(item);
  }
  return result;
}

function stream<T>(iterable : T[]){
  let count = 0;
  return {
    async *iterable(){
      for(const item of iterable){
        count++;
        if(false === (yield item)) break;
      }
    },
    get count(){
      return count;
    }
  }
}

interface Node {
  readonly hash : string,
  readonly parents : Node[]
}

async function* walkit(node : Node) : AsyncIterableIterator<HashAndCommit<{}>> {
  const queue = [node];
  const visited = new Set<string>(node.hash);
  while(queue.length > 0){
    const commit = queue.shift();
    if(!commit) return;
    const visitParents = yield {hash: commit.hash, commit: {}};
    if(visitParents === false) continue;
    for(const parent of commit.parents){
      if(visited.has(parent.hash)) continue;
      visited.add(parent.hash);
      queue.push(parent);
    }
  }
}

const dummyCommit = (hash : string) => ({});

function ofLength(count=10){
  const result = [];
  for(let i=0; i<count; i++){
    result.push(i);
  }
  return result;
}