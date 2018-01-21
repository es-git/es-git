import test from 'ava';

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
  const local = stream([
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  const remote = stream([
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result, [
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  t.is(local.count, 3);
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
  t.deepEqual(result, []);
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
    {hash:'fff', commit: {}}
  ]);
  const result = await getCommitsToPush(local.iterable(), remote.iterable());
  t.deepEqual(result, [
    {hash:'aaa', commit: {}},
    {hash:'bbb', commit: {}},
    {hash:'ccc', commit: {}}
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 3);
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
  t.deepEqual(result, []);
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
  t.deepEqual(result, []);
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
  t.deepEqual(result, [
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
    {hash:'333', commit: {}},
    {hash:'444', commit: {}},
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
  t.deepEqual(result, [
    {hash:'111', commit: {}},
    {hash:'222', commit: {}},
  ]);
  t.is(local.count, 4);
  t.is(remote.count, 5);
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
        yield item;
      }
    },
    get count(){
      return count;
    }
  }
}

function ofLength(count=10){
  const result = [];
  for(let i=0; i<count; i++){
    result.push(i);
  }
  return result;
}