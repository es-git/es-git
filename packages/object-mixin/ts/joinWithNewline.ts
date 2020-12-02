import {
  encode, NEWLINE
} from '@es-git/core';

export default function joinWithNewline(...values: (string | Uint8Array)[]) {
  const size = values.map(x => x.length).reduce((a, b) => a + b, 0);
  let result = new Uint8Array(values.length - 1 + size);
  let offset = 0;
  for (const arr of values) {
    if (offset > 0) {
      result = maybeGrow(result, offset+1);
      result.set([NEWLINE], offset++);
    }
    if (typeof (arr) === 'string') {
      const bytes = encode(arr);
      result = maybeGrow(result, offset+bytes.length);
      result.set(bytes, offset);
    } else {
      result = maybeGrow(result, offset+arr.length);
      result.set(arr, offset);
    }
    offset += arr.length;
  }
  return result;
}

function maybeGrow(array: Uint8Array, newSize: number){
  if(newSize < array.length) return array;
  return grow(array, newSize);
}

function grow(array: Uint8Array, size: number){
  const newArray = new Uint8Array(size);
  newArray.set(array);
  return newArray;
}