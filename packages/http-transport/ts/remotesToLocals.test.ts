import remotesToLocals from './remotesToLocals';

const remoteRefs = [
  {name: '/refs/heads/master', hash:'aaa'},
  {name: '/refs/heads/feature', hash:'bbb'}
];

test('empty list', () => {
  const localRefs: string[] = [];

  const refs = remotesToLocals(remoteRefs, localRefs);

  expect(refs).toEqual([]);
});

test('one direct', () => {
  const localRefs = [
    '/refs/heads/master:/refs/remotes/origin/master'
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  expect(refs).toEqual([
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'}
  ]);
});

test('two direct', () => {
  const localRefs = [
    '/refs/heads/master:/refs/remotes/origin/master',
    '/refs/heads/feature:/refs/remotes/origin/feature',
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  expect(refs).toEqual([
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'},
    {remote:'/refs/heads/feature', local:'/refs/remotes/origin/feature', hash:'bbb'}
  ]);
});

test('one star', () => {
  const localRefs = [
    '/refs/heads/*:/refs/remotes/origin/*'
  ];

  const refs = remotesToLocals(remoteRefs, localRefs);

  expect(refs).toEqual([
    {remote:'/refs/heads/master', local:'/refs/remotes/origin/master', hash:'aaa'},
    {remote:'/refs/heads/feature', local:'/refs/remotes/origin/feature', hash:'bbb'}
  ]);
});