import parsePackResponse from './parsePackResponse';
import streamToAsyncIterator from './utils/streamToAsyncIterator';
import * as fs from 'fs';

const sampleFile = __dirname + '/../samples/fetchResponse.txt';

test('parse side-band-64', async () => {
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
  expect(actualTypes).toEqual(expectedTypes);
  expect(actualProgress).toMatchSnapshot();
});
