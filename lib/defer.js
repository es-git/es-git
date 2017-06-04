"use strict";

export default (typeof process === "object" && typeof process.nextTick === "function")
  ? /* node.js*/ process.nextTick
  : (typeof setImmediate === "function")
  ? /* some browsers */ setImmediate
  : /* most other browsers */ ((() => {
    const timeouts = [];
    const messageName = "zero-timeout-message";
    window.addEventListener("message", function handleMessage(event) {
      if (event.source == window && event.data == messageName) {
        event.stopPropagation();
        if (timeouts.length > 0) {
          const fn = timeouts.shift();
          fn();
        }
      }
    }, true);

    function defer (fn) {
      timeouts.push(fn);
      window.postMessage(messageName, "*");
    };
  }))();
