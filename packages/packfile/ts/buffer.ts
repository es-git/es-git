
export default class Buffer {
  private readonly data : Uint8Array;
  private pointer = 0;
  constructor(data : Uint8Array){
    this.data = data;
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