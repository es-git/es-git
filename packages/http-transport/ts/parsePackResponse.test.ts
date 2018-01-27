import test from 'ava';
import parsePackResponse from './parsePackResponse';
import streamToAsyncIterator from './utils/streamToAsyncIterator';
import * as fs from 'fs';

const sampleFile = __dirname + '/../samples/fetchResponse.txt';

test.only('parse side-band-64', async t => {
  const expectedTypes = [
    'nak',
    'progress',
    'progress',
    'progress',
    'progress',
    'progress',
    'progress',
    'progress',
    'pack',
    'pack',
    'progress',
  ];
  const actualTypes = [];
  let actualProgress = '';
  for await(const result of parsePackResponse(streamToAsyncIterator(fs.createReadStream(sampleFile)))){
    actualTypes.push(result.type);
    if(result.type === 'progress'){
      actualProgress += result.message;
    }
  }
  t.deepEqual(actualTypes, expectedTypes);
  t.snapshot(actualProgress);
});
