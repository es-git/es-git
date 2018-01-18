import test from 'ava';
import remotesToLocals from './remotesToLocals';

const remoteRefs = [
  {name: '/refs/heads/master', hash:'aaa'},
  {name: '/refs/heads/feature', hash:'bbb'}
];

test('empty list', t => {
  const localRefs: string[] = [];

  const refs = remotesToLocals(remoteRefs, localRefs);

  t.deepEqual(refs, []);
});

test('one direct', t => {
  const localRefs = [
    '/refs/heads/master:/refs/remotes/origin/master'
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  t.deepEqual(refs, [
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'}
  ]);
});

test('two direct', t => {
  const localRefs = [
    '/refs/heads/master:/refs/remotes/origin/master',
    '/refs/heads/feature:/refs/remotes/origin/feature',
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  t.deepEqual(refs, [
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'},
    {remote:'/refs/heads/feature', local:'/refs/remotes/origin/feature', hash:'bbb'}
  ]);
});

test('one star', t => {
  const localRefs = [
    '/refs/heads/*:/refs/remotes/origin/*'
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  t.deepEqual(refs, [
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'},
    {remote:'/refs/heads/feature', local:'/refs/remotes/origin/feature', hash:'bbb'}
  ]);
});