import { ClientCaps } from './types';
import { Buffer } from '@es-git/core';
import { TextDecoder } from 'text-encoding';

export const NEWLINE = '\n'.charCodeAt(0);
const decoder = new TextDecoder();

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
      console.log(decoder.decode(line));
      const lineBuffer = new Buffer(line);
      if(isACK(lineBuffer)){
        lineBuffer.next(4);
        const hash = toHex(lineBuffer.next(20));
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
  const size = fromHex(line);
  if(size === 0) {
    return undefined;
  }
  const result = line.next(size - 4);
  if(line.data[line.pos] === NEWLINE) line.next();
  return result;
}

function fromHex(line : Buffer){
  let size = 0;
  for(let i=0; i<4; i++){
    size = (size<<4) | toDecimal(line.next());
  }
  return size;
}

function toDecimal(nibble : number) {
  nibble |= 0;
  return (nibble < 0x57 ? (nibble - 0x30) : (nibble - 0x57))|0;
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

function toHex(binary : Uint8Array, start = 0, end = binary.length) {
  var hex = "";
  for (var i = start; i < end; i++) {
    var byte = binary[i];
    hex += String.fromCharCode(nibbleToCode(byte >> 4)) +
           String.fromCharCode(nibbleToCode(byte & 0xf));
  }
  return hex;
}

function nibbleToCode(nibble : number) {
  nibble |= 0;
  return (nibble + (nibble < 10 ? 0x30 : 0x57))|0;
}