import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);

import differingRefs from './differingRefs';

test('nothing locally', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'a', hash:'aaa'},
    {name:'b', hash:'bbb'},
    {name:'c', hash:'ccc'}
  ];
  const result = await differingRefs([], localRefs, hasObject);

  t.deepEqual(result, ['aaa', 'bbb', 'ccc']);
  t.true(hasObject.calledThrice);
});

test('exactly the same locally and remotly', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'a', hash:'aaa'},
    {name:'b', hash:'bbb'},
    {name:'c', hash:'ccc'}
  ];
  const result = await differingRefs(localRefs, localRefs, hasObject);

  t.deepEqual(result, []);
  t.true(hasObject.notCalled);
});

test('different locally and remotly', async t => {
  const hasObject = sinon.stub().resolves(false);
  const localRefs = [
    {name:'a', hash:'aaa'},
    {name:'b', hash:'bbb'},
    {name:'c', hash:'ccc'}
  ];
  const remoteRefs = [
    {name:'a', hash:'ddd'},
    {name:'b', hash:'eee'},
    {name:'c', hash:'fff'}
  ];
  const result = await differingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, ['ddd', 'eee', 'fff']);
  t.true(hasObject.calledThrice);
});

test('different local ahead of remote', async t => {
  const hasObject = sinon.stub().resolves(true);
  const localRefs = [
    {name:'a', hash:'aaa'},
    {name:'b', hash:'bbb'},
    {name:'c', hash:'ccc'}
  ];
  const remoteRefs = [
    {name:'a', hash:'ddd'},
    {name:'b', hash:'eee'},
    {name:'c', hash:'fff'}
  ];
  const result = await differingRefs(localRefs, remoteRefs, hasObject);

  t.deepEqual(result, []);
  t.true(hasObject.calledThrice);
});