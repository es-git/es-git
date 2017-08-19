import { ClientCaps } from './types';
import { Buffer, decode, NEWLINE, fromHex } from '@es-git/core';

export interface Response {
  readonly acks : string[]
  readonly shallow : string[]
  readonly unshallow : string[]
}

export interface AckResponse extends Response {
  readonly type : 'ack'
}

export interface PackResponse extends Response {
  readonly type : 'pack'
  readonly pack : Uint8Array
}

export type WantResponse =
  AckResponse |
  PackResponse;

const parseLine = switchParse<WantResponse>({
  'ACK ': (buffer, state) => ({
    ...state,
    acks: [...state.acks, decode(buffer.next(40))]
  }),
  'NAK ': (buffer, state) => state,
  'shallow ': (buffer, state) => ({
    ...state,
    shallow: [...state.shallow, decode(buffer.next(40))]
  }),
  'unshallow ': (buffer, state) => ({
    ...state,
    unshallow: [...state.unshallow, decode(buffer.next(40))]
  })
});

export default function parseWantResponse(response : Uint8Array) : WantResponse {
  const buffer = new Buffer(response);
  let result : WantResponse = {
    type: 'ack',
    acks: [],
    shallow: [],
    unshallow: []
  };

  while(!buffer.isDone){
    if(isPACK(buffer)){
      result = {
        ...result,
        type: 'pack',
        pack: buffer.rest()
      };
    }else{
      const line = unpktLine(buffer);
      if(line){
        result = parseLine(new Buffer(line), result);
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
  if(line.peek() === NEWLINE) line.next();
  return result;
}

function isPACK(buffer : Buffer){
  return buffer.peekInt32() === 0x5041434b;
}

function switchParse<T>(cases : {[key : string] : (buffer : Buffer, state : T) => T}){
  const tree = Object.keys(cases)
    .map(key => ({key: key.split('').map(c => c.charCodeAt(0)), value: cases[key]}))
    .reduce((out, {key: [k, ...rest], value}) => {
      out[k] = unwrap(rest.length, value)
      return out;
    }, [] as ((buffer : Buffer, state : T) => T)[]);

  return (line : Buffer, state : T) => {
    const action = tree[line.next()];
    if(!action){
      throw new Error(`unknown key ${decode(line.soFar())}`);
    }

    return action(line, state);
  };
}

function unwrap<T>(length : number, action : (buffer : Buffer, state : T) => T){
  return (buffer : Buffer, state : T) => {
    buffer.next(length);
    return action(buffer, state);
  }
}