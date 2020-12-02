import Terminal from './index';

test('log', () => {
  const terminal = new Terminal();
  terminal.log('something');
  expect(terminal.content).toBe('something');
});

test('log with newline', () => {
  const terminal = new Terminal();
  terminal.log('something\n');
  expect(terminal.content).toBe('something\n');
});

test('log with newline multiple', () => {
  const terminal = new Terminal();
  terminal.log('something\n');
  terminal.log('else');
  expect(terminal.content).toBe('something\nelse');
});

test('log with newline at start', () => {
  const terminal = new Terminal();
  terminal.log('something');
  terminal.log('\nelse');
  expect(terminal.content).toBe('something\nelse');
});

test('log with carrige return', () => {
  const terminal = new Terminal();
  terminal.log('something\r');
  expect(terminal.content).toBe('something');
});

test('log multiple with carrige return', () => {
  const terminal = new Terminal();
  terminal.log('something\r');
  terminal.log('else');
  expect(terminal.content).toBe('else');
});

test('log with carrige return at start', () => {
  const terminal = new Terminal();
  terminal.log('something');
  terminal.log('\relse');
  expect(terminal.content).toBe('else');
});

test('log with newline then carrige return overwrites', () => {
  const terminal = new Terminal();
  terminal.log('some\nthing');
  terminal.log('\relse');
  expect(terminal.content).toBe('some\nelse');
});

test('log with carrige return at end overwrites', () => {
  const terminal = new Terminal();
  terminal.log('some\nthing\r');
  terminal.log('else');
  expect(terminal.content).toBe('some\nelse');
});

test('log overwrites', () => {
  const terminal = new Terminal();
  terminal.log('some\nthing\relse');
  expect(terminal.content).toBe('some\nelse');
});

test('log overwrites multiple', () => {
  const terminal = new Terminal();
  terminal.log('some\rthing\relse\r');
  expect(terminal.content).toBe('else');
});

test('log progress', () => {
  const terminal = new Terminal();
  terminal.log('start\n');
  terminal.log('1/5\r');
  terminal.log('2/5\r');
  terminal.log('3/5\r');
  terminal.log('4/5\r');
  terminal.log('5/5\r');
  terminal.log('done\n');
  expect(terminal.content).toBe('start\ndone\n');
});