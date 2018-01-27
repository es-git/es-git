import { concat } from '@es-git/core';

export default async function asyncIteratorToBuffer(iterator : AsyncIterableIterator<Uint8Array>){
  const body = [];
  for await(const chunk of iterator){
    body.push(chunk);
  }
  return concat(...body).buffer as ArrayBuffer
}