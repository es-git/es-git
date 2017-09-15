import * as pako from 'pako';
import sha1, { Sha1 } from 'git-sha1';
import { AsyncBuffer, unpackHash } from '@es-git/core';

import {
  Type,
  Entry
} from './types';

type $State<S extends string, T> = T & {
  readonly state : S
}

interface StartState {
  readonly buffer : HashWrapper
}

interface PackState extends StartState {
}

interface VersionState extends PackState {
  readonly version : number
}

interface EntriesState extends VersionState {
  readonly entryCount : number
}

interface HeaderState extends EntriesState {
  readonly type : Type.blob | Type.commit | Type.tag | Type.tree
  readonly offset : number
  readonly size : number
}

interface DeltaHeaderState extends EntriesState {
  readonly offset : number
  readonly size : number
}

interface OfsDeltaState extends DeltaHeaderState {
  readonly type : Type.ofsDelta
  readonly ref : number
}

interface RefDeltaState extends DeltaHeaderState {
  readonly type : Type.refDelta
  readonly ref : string
}

interface ChecksumState extends EntriesState {
  readonly checksum : string
}

interface EntryState extends EntriesState {
  readonly entry : Entry
}

type State =
  $State<'start', StartState> |
  $State<'pack', PackState> |
  $State<'version', VersionState> |
  $State<'entries', EntriesState> |
  $State<'header', HeaderState> |
  $State<'ofs-header', DeltaHeaderState> |
  $State<'ref-header', DeltaHeaderState> |
  $State<'ofs-delta', OfsDeltaState> |
  $State<'ref-delta', RefDeltaState> |
  $State<'entry', EntryState> |
  $State<'done', ChecksumState>;

class HashWrapper extends AsyncBuffer{
  private sha : Sha1
  constructor(chunks : AsyncIterableIterator<Uint8Array>){
    super(chunks);
    this.sha = sha1();
  }

  get pos(){
    return super.pos;
  }

  next() : Promise<number>
  next(length : number) : Promise<Uint8Array>
  async next(length? : number) {
    if(length === undefined){
      const result = await super.next();
      this.sha.update(String.fromCharCode(result));
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

export default async function* parsePackfile(chunks : AsyncIterableIterator<Uint8Array>) : AsyncIterableIterator<Entry> {
  let state : State = {
    state: 'start',
    buffer: new HashWrapper(chunks)
  };

  do {
    state = await $step(state);
    if(state.state === 'entry'){
      yield state.entry;
    }
  } while(state.state !== 'done');
}

async function $step(state : State){
  switch(state.state){
    case 'start':
      return $pack(state);
    case 'pack':
      console.log('pack', state.buffer.pos);
      return $version(state);
    case 'version':
      console.log('version', state.buffer.pos);
      return $entries(state);
    case 'entries':
      console.log('entries', state.buffer.pos);
      return $header(state);
    case 'ofs-header':
      return $ofsDelta(state);
    case 'ref-header':
      return $refDelta(state);
    case 'header':
    case 'ofs-delta':
    case 'ref-delta':
      return $body(state);
    case 'entry':
      if(state.entryCount > 0){
        return $header(state);
      }else{
        console.log('cheksum');
        return $checksum(state);
      }
    default:
      throw new Error(`Unknown state ${state}`);
  }
}

// The first four bytes in a packfile are the bytes 'PACK'
async function $pack(state : StartState) : Promise<State> {
  if(await state.buffer.nextInt32() === 0x5041434b)
    return {
      ...state,
      state: 'pack'
    };
  else
    throw new Error("Invalid packfile header");
}

// The version is stored as an unsigned 32 integer in network byte order.
// It must be version 2 or 3.
async function $version(state : PackState) : Promise<State> {
  const version = await state.buffer.nextInt32();
  if (version === 2 || version === 3)
    return {
      ...state,
      state: 'version',
      version
    };
  else
    throw new Error("Invalid version number " + version);
}

// The number of objects in this packfile is also stored as an unsigned 32 bit int.
async function $entries(state : VersionState) : Promise<State> {
  const entryCount = await state.buffer.nextInt32();
  console.log(entryCount);
  return {
    ...state,
    state: 'entries',
    entryCount
  };
}

// n-byte type and length (3-bit type, (n-1)*7+4-bit length)
// CTTTSSSS
// C is continue bit, TTT is type, S+ is length
// Second state in the same header parsing.
// CSSSSSSS*
async function $header(state : EntriesState) : Promise<State> {
  const offset = state.buffer.pos;
  let byte = await state.buffer.next();
  const type = (byte >> 4) & 0x7;
  let size = byte & 0xf;
  let left = 4;
  while (byte & 0x80) {
    byte = await state.buffer.next();
    size |= (byte & 0x7f) << left;
    left += 7;
  }
  if(type === 6){
    return {
      ...state,
      state: 'ofs-header',
      offset,
      size
    }
  }else if(type === 7){
    return {
      ...state,
      state: 'ref-header',
      offset,
      size
    }
  }else{
    return {
      ...state,
      state: 'header',
      type,
      offset,
      size
    }
  };
}

// Big-endian modified base 128 number encoded ref offset
async function $ofsDelta(state : DeltaHeaderState) : Promise<State> {
  return {
    ...state,
    state: 'ofs-delta',
    type: Type.ofsDelta,
    ref: await varLen(state.buffer)
  };
}

// 20 byte raw sha1 hash for ref
async function $refDelta(state : DeltaHeaderState) : Promise<State> {
  return {
    ...state,
    state: 'ref-delta',
    type: Type.refDelta,
    ref: unpackHash(await state.buffer.next(20))
  };
}

// Feed the deflated code to the inflate engine
async function $body(state : HeaderState | OfsDeltaState | RefDeltaState) : Promise<State> {
  const inf = new pako.Inflate();
  do {
    inf.push(await state.buffer.next(1));
  } while(inf.err === 0 && inf.result === undefined);
  if(inf.err != 0) throw new Error(`Inflate error ${inf.err} ${inf.msg}`);
  const data = inf.result as Uint8Array;
  if (data.length !== state.size)
    throw new Error(`Length mismatch, expected ${state.size} got ${data.length}`);

  return {
    ...state,
    state: 'entry',
    entry: entry(state, data),
    entryCount: state.entryCount-1
  }
}

// 20 byte checksum
async function $checksum(state : EntriesState) : Promise<State> {
  const actual = state.buffer.digest();
  console.log('actual', actual);
  const checksum = unpackHash(await state.buffer.next(20));
  if (checksum !== actual) throw new Error(`Checksum mismatch: ${actual} != ${checksum}`);
  return {
    ...state,
    state: 'done',
    checksum
  };
}

function entry(state : HeaderState | RefDeltaState | OfsDeltaState, body : Uint8Array) : Entry {
  if(state.type == Type.ofsDelta){
    return {
      type: Type.ofsDelta,
      ref: state.ref,
      body,
      offset: state.offset
    };
  }else if(state.type == Type.refDelta){
    return {
      type: Type.refDelta,
      ref: state.ref,
      body,
      offset: state.offset
    };
  }else{
    return {
      type: state.type,
      body,
      offset: state.offset
    };
  }
}

async function varLen(buffer : AsyncBuffer){
  let byte = await buffer.next();
  let ref = byte & 0x7f;
  while (byte & 0x80) {
    byte = await buffer.next();
    ref = ((ref + 1) << 7) | (byte & 0x7f);
  }
  return ref;
}