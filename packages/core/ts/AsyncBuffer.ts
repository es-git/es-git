import { concat } from './utils';

export default class AsyncBuffer {
  private data : Uint8Array;
  private readonly source : AsyncIterableIterator<Uint8Array>;
  private pointer = 0;
  private consumed = 0;
  constructor(source : AsyncIterableIterator<Uint8Array>){
    this.source = source;
    this.data = new Uint8Array(0);
  }

  get pos(){
    return this.consumed + this.pointer;
  }

  private async nextData(length : number){
    while(this.pointer + length > this.data.length){
      const {value, done} = await this.source.next();
      if(done){
        throw new Error('done ' + this.pointer+ ' ' + length +' '+ this.data.length);
      }
      if(this.data.length > 0){
        this.consumed += this.pointer;
        this.data = concat(this.data.subarray(this.pointer), value);
        this.pointer = 0;
      }else{
        this.data = value;
      }
    }
  }

  next() : Promise<number>
  next(length : number) : Promise<Uint8Array>
  async next(length? : number) {
    if(length !== undefined){
      await this.nextData(length);
      return this.data.subarray(this.pointer, this.pointer += length);
    }else{
      await this.nextData(1);
      return this.data[this.pointer++];
    }
  }

  async nextInt32() : Promise<number> {
    await this.nextData(4);
    let result = 0;
    for(let i=0; i<4; i++){
      result = (result << 8) | this.data[this.pointer+i];
    }
    return result;
  }

  peek() : Promise<number>
  peek(length : number) : Promise<Uint8Array>
  async peek(length? : number) {
    if(length !== undefined){
      await this.nextData(length);
      return this.data.subarray(this.pointer, this.pointer + length);
    }else{
      await this.nextData(1);
      return this.data[this.pointer];
    }
  }

  async peekInt32() : Promise<number> {
    await this.nextData(4);
    let result = 0;
    for(let i=0; i<4; i++){
      result = (result << 8) | this.data[this.pointer+i];
    }
    return result;
  }

  rest() : AsyncIterableIterator<Uint8Array>
  rest(length : number) : AsyncIterableIterator<Uint8Array>
  async *rest(length? : number) : AsyncIterableIterator<Uint8Array> {
    if(length !== undefined){
      while(length > this.data.length - this.pointer){
        const chunkSize = this.data.length - this.pointer;
        if(chunkSize == 0){
          await this.peek(1);
        }else{
          yield await this.next(chunkSize);
          length -= chunkSize;
        }
      }
      yield await this.next(length);
    }else{
      yield await this.next(this.data.length - this.pointer);
      for await(const chunk of this.source){
        yield await chunk;
      }
    }
  }

  async isDone(){
    return this.nextData(1).then(x => false, x => true);
  }

  async complete(){
    for await(const rest of this.rest()){}
  }
}