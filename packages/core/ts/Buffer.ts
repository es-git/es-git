
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
      const result = this.data.slice(this.pointer, this.pointer+length);
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

  write(byte : number) : void
  write(bytes : Uint8Array) : void
  write(value : number | Uint8Array) {
    if(typeof value === 'number'){
      this.data[this.pointer++] = value;
    }else{
      this.data.set(value, this.pointer);
      this.pointer+=value.length;
    }
  }

  rest(){
    return this.next(this.data.length - this.pointer);
  }

  soFar(){
    return this.data.slice(0, this.pointer);
  }

  get isDone(){
    return this.pointer >= this.data.length;
  }
}