import defer from './defer';

export default function streamToAsyncIterator(readable : NodeJS.ReadableStream | ReadableStream) : AsyncIterableIterator<Uint8Array> {
  const reader = isBrowser(readable) ? readable.getReader() : toReader(readable);
  return {
    next(){
      return reader.read();
    },
    return(){
      return reader.releaseLock();
    },
    [Symbol.asyncIterator](){
      return this;
    }
  } as any as AsyncIterableIterator<Uint8Array>;
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
    },
    releaseLock(){
    }
  }
}

function isBrowser(body : ReadableStream | NodeJS.ReadableStream) : body is ReadableStream {
  return 'getReader' in body;
}