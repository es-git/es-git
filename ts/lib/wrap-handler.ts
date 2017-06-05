"use strict";

export default function wrapHandler<T>(fn : (value : T) => void, onError : (error : any) => void) {
  if (onError) {
    return (err : any, value : T) => {
      if (err) return onError(err);
      try {
        return fn(value);
      }
      catch (err) {
        return onError(err);
      }
    };
  }
  return (err : any, value : T) => {
    if (err) throw err;
    return fn(value);
  };
}
