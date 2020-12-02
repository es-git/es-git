import walk, { toRows, followPath, findStarts, parse } from './index';

test('start walking', () => {
  const walker = walk`
    a---(b)
  `;

  expect(walker.next().value).toBe('b');
});

test('start walking two entries', () => {
  const walker = walk`
      --(c)
     /     \
    a-------(b)
  `;;

  expect(walker.next().value).toBe('c');
  expect(walker.next().value).toBe('b');
});

test('followPath only o', () => {
  const diagram = toRows`
  o-
    \
  o------o
      /
     o
  `;

  const walk = followPath(diagram, 3, 9, '-');
  expect(walk.next().value).toEqual({row: 1, col: 2, hash: 'o'});
  expect(walk.next().value).toEqual({row: 3, col: 2, hash: 'o'});
  expect(walk.next().value).toEqual({row: 5, col: 5, hash: 'o'});
  expect(walk.next().done).toBe(true);
});

test('followPath hex', () => {
  const diagram = toRows`
  aaa-
      \
  F1C------o
      /
     D
  `;

  const walk = followPath(diagram, 3, 9, '-');
  expect(walk.next().value).toEqual({row: 1, col: 2, hash: 'aaa'});
  expect(walk.next().value).toEqual({row: 3, col: 2, hash: 'F1C'});
  expect(walk.next().value).toEqual({row: 5, col: 5, hash: 'D'});
  expect(walk.next().done).toBe(true);
});

test('followPath merge', () => {
  const diagram = toRows`
       --
      /  \
  F1C------o
  `;

  const walk = followPath(diagram, 3, 11, '-');
  expect(walk.next().value).toEqual({row: 3, col: 2, hash: 'F1C'});
  expect(walk.next().value).toEqual({row: 3, col: 2, hash: 'F1C'});
  expect(walk.next().done).toBe(true);
});

test('followPath converge', () => {
  const diagram = toRows`
       --o
      /
  F1C------o
  `;

  const walk = followPath(diagram, 3, 9, '-');
  expect(walk.next().value).toEqual({row: 3, col: 2, hash: 'F1C'});
  expect(walk.next().done).toBe(true);
});

test('walk two commits', () => {
  const walker = walk`
    a---(b)
  `;

  expect(walker.next().value).toBe('b');
  expect(walker.next().value).toBe('a');
  expect(walker.next().done).toBe(true);
});

test('walk three commits', () => {
  const walker = walk`
    a--o--(b)
  `;

  expect(walker.next().value).toBe('b');
  expect(walker.next().value).toBe('1a7');
  expect(walker.next().value).toBe('a');
  expect(walker.next().done).toBe(true);
});

test('find start', () => {
  const result = findStarts(toRows`
  a--o--(beef)
  `);

  expect(result.next().value).toEqual({row: 1, col: 9, hash: 'beef'});
  expect(result.next().done).toBe(true);
});

test('find start []', () => {
  const result = findStarts(toRows`
  a--o--[beef]
  `, '[*]');

  expect(result.next().value).toEqual({row: 1, col: 9, hash: 'beef'});
  expect(result.next().done).toBe(true);
});

test('find start [beef]', () => {
  const result = findStarts(toRows`
  [a]--o--[beef]--[b]
  `, '[beef]');

  expect(result.next().value).toEqual({row: 1, col: 11, hash: 'beef'});
  expect(result.next().done).toBe(true);
});

test('find start [] twice on same row', () => {
  const result = findStarts(toRows`
  a--o--[beef]--[dead]
  `, '[*]');

  expect(result.next().value).toEqual({row: 1, col: 9, hash: 'beef'});
  expect(result.next().value).toEqual({row: 1, col: 17, hash: 'dead'});
  expect(result.next().done).toBe(true);
});

test('walkSync', () => {
  const walker = walk`
    a--o--(b)
  `;

  expect(walker.next().value).toBe('b');
  expect(walker.next().value).toBe('1a7');
  expect(walker.next().value).toBe('a');
  expect(walker.next().done).toBe(true);
});

test('walk [] and ()', async () => {
  const walk = parse`a--o--[b]--(c)`;
  const walkerA = walk('[*]');
  const walkerB = walk('(*)');

  expect((await walkerA.next()).value).toEqual({hash: 'b', commit: {parents: ['0a3']}});
  expect((await walkerA.next()).value).toEqual({hash: '0a3', commit: {parents: ['a']}});
  expect((await walkerA.next()).value).toEqual({hash: 'a', commit: {parents: []}});
  expect((await walkerA.next()).done).toBe(true);

  expect((await walkerB.next()).value).toEqual({hash: 'c', commit: {parents: ['b']}});
  expect((await walkerB.next()).value).toEqual({hash: 'b', commit: {parents: ['0a3']}});
  expect((await walkerB.next()).value).toEqual({hash: '0a3', commit: {parents: ['a']}});
  expect((await walkerB.next()).value).toEqual({hash: 'a', commit: {parents: []}});
  expect((await walkerB.next()).done).toBe(true);
});

test('walk merge', () => {
  const walker = walk`
    a--o--(b)
     \   /
      -o-
  `;

  expect(walker.next().value).toBe('b');
  expect(walker.next().value).toBe('1a7');
  expect(walker.next().value).toBe('3a7');
  expect(walker.next().value).toBe('a');
  expect(walker.next().value).toBe('a');
  expect(walker.next().done).toBe(true);
});

test('walk cancel', () => {
  const walker = walk`
    a--o--(b)

    c--o--(d)
  `;

  expect(walker.next().value).toBe('b');
  expect(walker.next().value).toBe('d');
  expect(walker.next(false).value).toBe('1a7');
  expect(walker.next().value).toBe('a');
  expect(walker.next().done).toBe(true);
});