import defer from './defer';

export default async function* streamToAsyncIterator(readable : NodeJS.ReadableStream | ReadableStream) : AsyncIterableIterator<Uint8Array> {
  const reader = isBrowser(readable) ? readable.getReader() : toReader(readable);
  while(true){
    const {value, done} = await reader.read() as {value : Uint8Array, done : boolean};
    if(done) return;
    yield value;
  }
}

function toReader(stream : NodeJS.ReadableStream){
  let readable = defer<boolean>();
  const onEnd = new Promise<boolean>(res => stream.on('end', () => res(true)));
  stream.on('readable', () => readable.resolve(false));
  return {
    async read() : Promise<{done: false, value: Uint8Array} | {done: true}> {
      let value = stream.read() as Buffer | null;
      while(value === null){
        readable = defer<boolean>();
        const done = await Promise.race([
          onEnd,
          readable.promise
        ]);
        if(done){
          return {done};
        }
        value = stream.read() as Buffer;
      }

      return {
        done: false,
        value: new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
      };
    }
  }
}

function isBrowser(body : ReadableStream | NodeJS.ReadableStream) : body is ReadableStream {
  return 'getReader' in body;
}