import defer from './defer';
import { Readable } from 'stream';

export default function asyncIteratorToStream(iterator : AsyncIterableIterator<Uint8Array>) : ReadableStream | NodeJS.ReadableStream {
  if(typeof ReadableStream !== 'undefined'){
    return new (ReadableStream as any)({
      async start(controller : any){
        try{
          for await (const value of iterator){
            controller.enqueue(value);
          }
        }finally{
          controller.close();
        }
      }
    });
  }

  return new class extends Readable{
    async _read(size : number){
      for await(const value of unbreakable(iterator)) {
        if(!this.push(value)) return;
      }

      this.push(null);
    }
  };
}

function unbreakable<T>(iterator : AsyncIterableIterator<T>) : AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](){
      return {
        next(){
          return iterator.next();
        }
      }
    }
  }
}