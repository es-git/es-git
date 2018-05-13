import test from 'ava';
import * as sinon from 'sinon';

import findDifferingRefs from './findDifferingRefs';

test('nothing locally', async t => {
  const hasObject = sinon.stub().resolves(false);
  const remoteRefs = [
    {remote:'/refs/heads/a', local:'/refs/remotes/origin/a', hash:'aaa'},
    {remote:'/refs/heads/b', local:'/refs/remotes/origin/b', hash:'bbb'},
    {remote:'/refs/heads/c', local:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const result = await findDifferingRefs([], remoteRefs, hasObject);

  t.deepEqual(result, [
    {name:'/refs/remotes/origin/a', remoteHash:'aaa', localHash:undefined, hasRemote: false},
    {name:'/refs/remotes/origin/b', remoteHash:'bbb', localHash:undefined, hasRemote: false},
    {name:'/refs/remotes/origin/c', remoteHash:'ccc', localHash:undefined, hasRemote: false}
  ]);
  t.true(hasObject.calledThrice);
});

test('exactly the same locally and remotly', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'/refs/remotes/origin/a', hash:'aaa'},
    {name:'/refs/remotes/origin/b', hash:'bbb'},
    {name:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const remoteRefs = [
    {remote:'/refs/heads/a', local:'/refs/remotes/origin/a', hash:'aaa'},
    {remote:'/refs/heads/b', local:'/refs/remotes/origin/b', hash:'bbb'},
    {remote:'/refs/heads/c', local:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const result = await findDifferingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, []);
  t.true(hasObject.notCalled);
});

test('local ahead of remote', async t => {
  const hasObject = sinon.stub().resolves(true);
  const localRefs = [
    {name:'/refs/remotes/origin/a', hash:'aaa'},
    {name:'/refs/remotes/origin/b', hash:'bbb'},
    {name:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const remoteRefs = [
    {remote:'/refs/heads/a', local:'/refs/remotes/origin/a', hash:'ddd'},
    {remote:'/refs/heads/b', local:'/refs/remotes/origin/b', hash:'eee'},
    {remote:'/refs/heads/c', local:'/refs/remotes/origin/c', hash:'fff'}
  ];
  const result = await findDifferingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, [
    {name:'/refs/remotes/origin/a', localHash:'aaa', remoteHash:'ddd', hasRemote: true},
    {name:'/refs/remotes/origin/b', localHash:'bbb', remoteHash:'eee', hasRemote: true},
    {name:'/refs/remotes/origin/c', localHash:'ccc', remoteHash:'fff', hasRemote: true}
  ]);
  t.true(hasObject.calledThrice);
});

test('remote ahead of local', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'/refs/remotes/origin/a', hash:'aaa'},
    {name:'/refs/remotes/origin/b', hash:'bbb'},
    {name:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const remoteRefs = [
    {remote:'/refs/heads/a', local:'/refs/remotes/origin/a', hash:'ddd'},
    {remote:'/refs/heads/b', local:'/refs/remotes/origin/b', hash:'eee'},
    {remote:'/refs/heads/c', local:'/refs/remotes/origin/c', hash:'fff'}
  ];
  const result = await findDifferingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, [
    {name:'/refs/remotes/origin/a', localHash:'aaa', remoteHash:'ddd', hasRemote: false},
    {name:'/refs/remotes/origin/b', localHash:'bbb', remoteHash:'eee', hasRemote: false},
    {name:'/refs/remotes/origin/c', localHash:'ccc', remoteHash:'fff', hasRemote: false}
  ]);
  t.true(hasObject.calledThrice);
});

test('more local than remote', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'/refs/remotes/origin/a', hash:'aaa'},
    {name:'/refs/remotes/origin/b', hash:'bbb'},
    {name:'/refs/remotes/origin/c', hash:'ccc'}
  ];
  const remoteRefs = [
    {remote:'/refs/heads/a', local:'/refs/remotes/origin/a', hash:'ddd'}
  ];
  const result = await findDifferingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, [
    {name:'/refs/remotes/origin/a', localHash:'aaa', remoteHash:'ddd', hasRemote: false}
  ]);
  t.true(hasObject.calledOnce);
});
