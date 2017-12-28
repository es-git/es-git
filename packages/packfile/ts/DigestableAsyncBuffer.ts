import sha1, { Sha1 } from 'git-sha1';
import { AsyncBuffer } from '@es-git/core';

export default class DigestableAsyncBuffer extends AsyncBuffer{
  private sha : Sha1
  private temp : Uint8Array;
  constructor(chunks : AsyncIterableIterator<Uint8Array>){
    super(chunks);
    this.sha = sha1();
    this.temp = new Uint8Array(1);
  }

  next() : Promise<number>
  next(length : number) : Promise<Uint8Array>
  async next(length? : number) {
    if(length === undefined){
      const result = await super.next();
      this.temp[0] = result;
      this.sha.update(this.temp);
      return result;
    }else{
      const result = await super.next(length);
      this.sha.update(result);
      return result;
    }
  }

  async nextInt32() : Promise<number> {
    const buffer = await super.next(4);
    this.sha.update(buffer);
    let result = 0;
    for(let i=0; i<4; i++){
      result = (result << 8) | buffer[i];
    }
    return result;
  }

  digest(){
    const result = this.sha.digest();
    this.sha = sha1();
    return result;
  }
}