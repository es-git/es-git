
export default class Buffer {
  readonly data : Uint8Array;
  private pointer = 0;
  constructor(data : Uint8Array){
    this.data = data;
  }

  get pos(){
    return this.pointer;
  }

  next() : number
  next(length : number) : Uint8Array
  next(length? : number) {
    if(length !== undefined){
      length = Math.min(length, this.data.length - this.pointer);
      const result = this.data.subarray(this.pointer, this.pointer + length);
      this.pointer += length;
      return result;
    }else{
      return this.data[this.pointer++];
    }
  }

  nextInt32() : number {
    let result = 0;
    for(let i=0; i<4; i++){
      result = (result << 8) | this.next();
    }
    return result;
  }

  peek() : number
  peek(length : number) : Uint8Array
  peek(length? : number) {
    if(length !== undefined){
      length = Math.min(length, this.data.length - this.pointer);
      const result = this.data.subarray(this.pointer, this.pointer + length);
      return result;
    }else{
      return this.data[this.pointer];
    }
  }

  peekInt32() : number {
    let result = 0;
    for(let i=0; i<4; i++){
      result = (result << 8) | this.data[this.pointer+i];
    }
    return result;
  }

  write(byte : number) : void
  write(bytes : Uint8Array) : void
  write(bytes : Uint8Array, offset : number, length : number) : void
  write(value : number | Uint8Array, offset? : number, length? : number) {
    if(typeof value === 'number'){
      this.data[this.pointer++] = value;
    }else{
      if(offset !== undefined){
        length = length === undefined ? value.length - offset : length
        this.data.set(value.subarray(offset, offset + length), this.pointer);
        this.pointer += length;
      }else{
        this.data.set(value, this.pointer);
        this.pointer += value.length;
      }
    }
  }

  rest(){
    return this.next(this.data.length - this.pointer);
  }

  soFar(){
    return this.data.subarray(0, this.pointer);
  }

  get isDone(){
    return this.pointer >= this.data.length;
  }
}