import * as fs from 'fs';
import streamToAsyncIterator from './streamToAsyncIterator';


const sampleFile = __dirname + '/../../samples/fetchResponse.txt';

test('streamToAsyncIterator', async () => {
  const expected = fs.readFileSync(sampleFile);
  let pos = 0;
  for await(const chunk of streamToAsyncIterator(fs.createReadStream(sampleFile))){
    expect(chunk.buffer).toEqual(expected.buffer.slice(pos, pos+chunk.length));
    pos += chunk.length;
  }
});