import test from 'ava';

import walk, { toRows, followPath, findStarts, parse } from './index';

test('start walking', t => {
  const walker = walk`
    a---(b)
  `;

  t.is(walker.next().value, 'b');
});

test('start walking two entries', t => {
  const walker = walk`
      --(c)
     /     \
    a-------(b)
  `;;

  t.is(walker.next().value, 'c');
  t.is(walker.next().value, 'b');
});

test('followPath only o', t => {
  const diagram = toRows`
  o-
    \
  o------o
      /
     o
  `;

  const walk = followPath(diagram, 3, 9, '-');
  t.deepEqual(walk.next().value, {row: 1, col: 2, hash: 'o'});
  t.deepEqual(walk.next().value, {row: 3, col: 2, hash: 'o'});
  t.deepEqual(walk.next().value, {row: 5, col: 5, hash: 'o'});
  t.true(walk.next().done);
});

test('followPath hex', t => {
  const diagram = toRows`
  aaa-
      \
  F1C------o
      /
     D
  `;

  const walk = followPath(diagram, 3, 9, '-');
  t.deepEqual(walk.next().value, {row: 1, col: 2, hash: 'aaa'});
  t.deepEqual(walk.next().value, {row: 3, col: 2, hash: 'F1C'});
  t.deepEqual(walk.next().value, {row: 5, col: 5, hash: 'D'});
  t.true(walk.next().done);
});

test('followPath merge', t => {
  const diagram = toRows`
       --
      /  \
  F1C------o
  `;

  const walk = followPath(diagram, 3, 11, '-');
  t.deepEqual(walk.next().value, {row: 3, col: 2, hash: 'F1C'});
  t.deepEqual(walk.next().value, {row: 3, col: 2, hash: 'F1C'});
  t.true(walk.next().done);
});

test('followPath converge', t => {
  const diagram = toRows`
       --o
      /
  F1C------o
  `;

  const walk = followPath(diagram, 3, 9, '-');
  t.deepEqual(walk.next().value, {row: 3, col: 2, hash: 'F1C'});
  t.true(walk.next().done);
});

test('walk two commits', t => {
  const walker = walk`
    a---(b)
  `;

  t.is(walker.next().value, 'b');
  t.is(walker.next().value, 'a');
  t.true(walker.next().done);
});

test('walk three commits', t => {
  const walker = walk`
    a--o--(b)
  `;

  t.is(walker.next().value, 'b');
  t.is(walker.next().value, '1a7');
  t.is(walker.next().value, 'a');
  t.true(walker.next().done);
});

test('find start', t => {
  const result = findStarts(toRows`
  a--o--(beef)
  `);

  t.deepEqual(result.next().value, {row: 1, col: 9, hash: 'beef'});
  t.true(result.next().done);
});

test('find start []', t => {
  const result = findStarts(toRows`
  a--o--[beef]
  `, '[]');

  t.deepEqual(result.next().value, {row: 1, col: 9, hash: 'beef'});
  t.true(result.next().done);
});

test('walkSync', t => {
  const walker = walk`
    a--o--(b)
  `;

  t.is(walker.next().value, 'b');
  t.is(walker.next().value, '1a7');
  t.is(walker.next().value, 'a');
  t.true(walker.next().done);
});

test('walk [] and ()', async t => {
  const diagram = parse`a--o--[b]--(c)`;
  const walkerA = diagram(h => ({}), '[]');
  const walkerB = diagram(h => ({}), '()');

  t.deepEqual((await walkerA.next()).value, {hash: 'b', commit: {}});
  t.deepEqual((await walkerA.next()).value, {hash: '0a3', commit: {}});
  t.deepEqual((await walkerA.next()).value, {hash: 'a', commit: {}});
  t.true((await walkerA.next()).done);

  t.deepEqual((await walkerB.next()).value, {hash: 'c', commit: {}});
  t.deepEqual((await walkerB.next()).value, {hash: 'b', commit: {}});
  t.deepEqual((await walkerB.next()).value, {hash: '0a3', commit: {}});
  t.deepEqual((await walkerB.next()).value, {hash: 'a', commit: {}});
  t.true((await walkerB.next()).done);
});

test('walk merge', t => {
  const walker = walk`
    a--o--(b)
     \   /
      -o-
  `;

  t.is(walker.next().value, 'b');
  t.is(walker.next().value, '1a7');
  t.is(walker.next().value, '3a7');
  t.is(walker.next().value, 'a');
  t.is(walker.next().value, 'a');
  t.true(walker.next().done);
});

test('walk cancel', t => {
  const walker = walk`
    a--o--(b)

    c--o--(d)
  `;

  t.is(walker.next().value, 'b');
  t.is(walker.next().value, 'd');
  t.is(walker.next(false).value, '1a7');
  t.is(walker.next().value, 'a');
  t.true(walker.next().done);
});