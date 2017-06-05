// Ultra simple test runner with TAP output.

import {inspect} from 'util';

import defer from '../lib/defer.js';
const log = console.log;
console.log = function () {
  const args = [].slice.call(arguments).map(arg => inspect(arg, {colors:true}));
  log(args.join(" ").split("\n").map(line => "# " + line).join("\n"));
};

export default tests => {
  let timeout;
  let test;
  let index = 0;
  log("1.." + (tests.length));
  next();
  function next(err) {
    if (timeout) clearTimeout(timeout);
    if (index) {
      if (err) {
        log(err.stack.split("\n").map(line => "# " + line).join("\n"));
        log("not ok " + index + " - " + test.name);
      }
      else {
        log("ok " + index + " - " + test.name);
      }
    }
    test = tests[index++];
    if (!test) return;
    timeout = setTimeout(onTimeout, 1000);
    try {
      if (test.length) test(next);
      else test();
    }
    catch (err) { return next(err); }
    if (!test.length) defer(next);
  }

  function onTimeout() {
    next(new Error("Test timeout"));
  }
};