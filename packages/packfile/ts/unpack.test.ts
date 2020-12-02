import { promises as fs } from 'fs';
import pipe from './pipe';
import unpack from './unpack';

test('unpack sample1', async () => {
  const pack = await fs.readFile(__dirname + '/../samples/sample1.pack');
  const entries = await pipe(stream(pack))
    .pipe(unpack)
    .then(collect);

  expect(entries).toMatchSnapshot();
  expect(entries.length).toBe(2651);
});

test('unpack sample2', async () => {
  const pack = await fs.readFile(__dirname + '/../samples/sample2.pack');
  const entries = await pipe(stream(pack))
    .pipe(unpack)
    .then(collect);

  expect(entries).toMatchSnapshot();
  expect(entries.length).toBe(3);
});

async function* stream(item : Buffer) : AsyncIterableIterator<Uint8Array> {
  yield toUint8Array(item);
}

async function collect<T>(iterator : AsyncIterableIterator<T>){
  const result : T[] = [];
  for await(const item of iterator){
    result.push(item);
  }
  return result
}

function toUint8Array(value : Buffer){
  return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
}