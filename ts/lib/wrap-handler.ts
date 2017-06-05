"use strict";

export default function wrapHandler(fn, onError) {
  if (onError) {
    return (err, value) => {
      if (err) return onError(err);
      try {
        return fn(value);
      }
      catch (err) {
        return onError(err);
      }
    };
  }
  return (err, value) => {
    if (err) throw err;
    return fn(value);
  };
}
