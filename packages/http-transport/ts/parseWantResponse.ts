import { concat } from '../../core/es';
import { ClientCaps } from './types';
import { AsyncBuffer, Buffer, decode, NEWLINE, fromHex } from '@es-git/core';

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
  readonly pack : AsyncIterable<Uint8Array>
}

export type WantResponse =
  AckResponse |
  PackResponse;

export interface AckToken {
  readonly type : 'ack'
  readonly hash : string
}

export interface NakToken {
  readonly type : 'nak'
}

export interface ShallowToken {
  readonly type : 'shallow'
  readonly hash : string
}

export interface UnshallowToken {
  readonly type : 'unshallow'
  readonly hash : string
}

export interface PackToken {
  readonly type : 'pack'
  readonly chunks : AsyncIterableIterator<Uint8Array>
}

export interface ProgressToken {
  readonly type : 'progress'
  readonly message : string
}

export interface ErrorToken {
  readonly type : 'error'
  readonly message : string
}

export type Token =
  AckToken |
  NakToken |
  ShallowToken |
  UnshallowToken |
  PackToken |
  ProgressToken |
  ErrorToken;

const parseLine = switchParse<Token>({
  'ACK ': async buffer => ({
    type: 'ack',
    hash: decode(await buffer.next(40))
  }),
  'NAK ': async buffer => ({
    type: 'nak'
  }),
  'shallow ': async buffer => ({
    type: 'shallow',
    hash: decode(await buffer.next(40))
  }),
  'unshallow ': async buffer => ({
    type: 'unshallow',
    hash: decode(await buffer.next(40))
  }),
  '\x01': async buffer => ({
    type: 'pack',
    chunks: buffer.rest()
  }),
  '\x02': async buffer => ({
    type: 'progress',
    message: decode(await consume(buffer.rest()))
  }),
  '\x03': async buffer => ({
    type: 'error',
    message: decode(await consume(buffer.rest()))
  })
});

export default async function* parseWantResponse(response : AsyncIterableIterator<Uint8Array>) : AsyncIterableIterator<Token> {
  const buffer = new AsyncBuffer(response);

  while(true){
    const line = await unpktLine(buffer);
    if(line){
      yield await parseLine(new AsyncBuffer(line));
    }else{
      if(await buffer.isDone()){
        break;
      }
    }
  }
}

async function unpktLine(line : AsyncBuffer) : Promise<AsyncIterableIterator<Uint8Array> | undefined> {
  const size = fromHex(await line.next(4));
  if(size === 0) {
    return undefined;
  }
  return line.rest(size - 4);
}

async function consume(stream : AsyncIterableIterator<Uint8Array>){
  const result : Uint8Array[] = [];
  for await(const chunk of stream){
    result.push(chunk);
  }
  return concat(...result);
}

function switchParse<T>(cases : {[key : string] : (buffer : AsyncBuffer) => Promise<T>}){
  const tree = Object.keys(cases)
    .map(key => ({char: key.charCodeAt(0), key, value: cases[key]}))
    .reduce((out, {char, key, value}) => {
      out[char] = unwrap(key.length, value)
      return out;
    }, [] as ((buffer : AsyncBuffer) => Promise<T>)[]);

  return async (line : AsyncBuffer) => {
    const char = await line.peek();
    const action = tree[char];
    if(!action){
      throw new Error(`unknown key >${String.fromCharCode(char)}< (${char})`);
    }

    return action(line);
  };
}

function unwrap<T>(length : number, action : (buffer : AsyncBuffer) => Promise<T>){
  return async (buffer : AsyncBuffer) => {
    await buffer.next(length);
    return action(buffer);
  }
}
