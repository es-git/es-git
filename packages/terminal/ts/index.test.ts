import test from 'ava';

import Terminal from './index';

test(t => {
  const terminal = new Terminal();
  terminal.log('something');
  t.is(terminal.content, 'something');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something\n');
  t.is(terminal.content, 'something\n');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something\n');
  terminal.log('else');
  t.is(terminal.content, 'something\nelse');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something');
  terminal.log('\nelse');
  t.is(terminal.content, 'something\nelse');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something\r');
  t.is(terminal.content, 'something');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something\r');
  terminal.log('else');
  t.is(terminal.content, 'else');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('something');
  terminal.log('\relse');
  t.is(terminal.content, 'else');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('some\nthing');
  terminal.log('\relse');
  t.is(terminal.content, 'some\nelse');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('some\nthing\r');
  terminal.log('else');
  t.is(terminal.content, 'some\nelse');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('some\nthing\relse');
  t.is(terminal.content, 'some\nelse');
});

test(t => {
  const terminal = new Terminal();
  terminal.log('start\n');
  terminal.log('1/5\r');
  terminal.log('2/5\r');
  terminal.log('3/5\r');
  terminal.log('4/5\r');
  terminal.log('5/5\r');
  terminal.log('done\n');
  t.is(terminal.content, 'start\ndone\n');
});