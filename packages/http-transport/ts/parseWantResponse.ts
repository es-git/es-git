import { ClientCaps } from './types';
import { Buffer, decode, NEWLINE, fromHex } from '@es-git/core';

export interface AckResponse {
  readonly type : 'ack'
  readonly acks : string[]
}

export interface PackResponse {
  readonly type : 'pack'
  readonly pack : Uint8Array
}

export type WantResponse =
  AckResponse |
  PackResponse;

export default function parseWantResponse(response : Uint8Array) : WantResponse {
  const buffer = new Buffer(response);
  const result : AckResponse = {
    type: 'ack',
    acks: []
  };
  while(!buffer.isDone){
    if(isPACK(buffer)){
      console.log('It is the PACK \\o/');
      return {
        type: 'pack',
        pack: buffer.rest()
      }
    }else{
      console.log('It is not the PACK (yet) :(');
      const line = unpktLine(buffer);
      if(!line) throw new Error('unexpected');
      console.log(decode(line));
      const lineBuffer = new Buffer(line);
      if(isACK(lineBuffer)){
        lineBuffer.next(4);
        const hash = decode(lineBuffer.next(40));
        console.log(hash);
        result.acks.push(hash);
      }else if(isNAK(lineBuffer)){
        lineBuffer.next(4);
      }
    }
  }

  return result;
}

function unpktLine(line : Buffer) : Uint8Array | undefined {
  const size = fromHex(line.next(4));
  if(size === 0) {
    return undefined;
  }
  const result = line.next(size - 4);
  if(line.data[line.pos] === NEWLINE) line.next();
  return result;
}

function isPACK(buffer : Buffer){
  return buffer.peekInt32() === 0x5041434b;
}

function isACK(buffer : Buffer){
  return buffer.peekInt32() === 0x41434b20;
}

function isNAK(buffer : Buffer){
  return buffer.peekInt32() === 0x4e414b20;
}
