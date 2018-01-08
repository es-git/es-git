import * as pako from 'pako';
import { AsyncBuffer, unpackHash } from '@es-git/core';
import DigestableAsyncBuffer from './DigestableAsyncBuffer';

import {
  Type,
  Entry,
  Progress
} from './types';

type $State<S extends string, T> = T & {
  readonly state : S
}

interface StartState {
  readonly buffer : DigestableAsyncBuffer
}

interface PackState extends StartState {
}

interface VersionState extends PackState {
  readonly version : number
}

interface EntriesState extends VersionState {
  readonly entryCount : number
  readonly entryIndex : number
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

export default async function* parsePackfile(chunks : AsyncIterableIterator<Uint8Array>, progress?: Progress) : AsyncIterableIterator<Entry> {
  let state : State = {
    state: 'start',
    buffer: new DigestableAsyncBuffer(chunks)
  };

  do {
    state = await $step(state, progress);
    if(state.state === 'entry'){
      yield state.entry;
    }
  } while(state.state !== 'done');
  state.buffer.complete();
}

async function $step(state : State, progress : Progress){
  switch(state.state){
    case 'start':
      return $pack(state);
    case 'pack':
      return $version(state);
    case 'version':
      return $entries(state);
    case 'entries':
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
      if(progress) progress(report(state));
      if(state.entryCount > state.entryIndex){
        return $header(state);
      }else{
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
  return {
    ...state,
    state: 'entries',
    entryCount,
    entryIndex: 0
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
    inf.push(await state.buffer.chunk());
  } while(inf.err === 0 && inf.result === undefined);
  state.buffer.rewind((inf as any).strm.avail_in);
  if(inf.err != 0) throw new Error(`Inflate error ${inf.err} ${inf.msg}`);
  const data = inf.result as Uint8Array;
  if (data.length !== state.size)
    throw new Error(`Length mismatch, expected ${state.size} got ${data.length}`);

  return {
    ...state,
    state: 'entry',
    entry: entry(state, data),
    entryIndex: state.entryIndex+1
  }
}

// 20 byte checksum
async function $checksum(state : EntriesState) : Promise<State> {
  const actual = state.buffer.digest();
  const checksum = unpackHash(await state.buffer.next(20));
  if (checksum !== actual) throw new Error(`Checksum mismatch: actual ${actual} != expected ${checksum}`);
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

const suffixes = ['Bytes', 'KiB', 'MiB', 'GiB'];
function report({entryCount: total, entryIndex: pos, buffer} : EntryState){
  const percent = (pos/total*100)|0;
  let size = buffer.pos;
  let suf=0;
  for(; size > 1024; suf++){
    size /= 1024;
  }
  if(pos === total){
    return `Receiving objects: ${percent}% (${pos}/${total}), ${size.toFixed(2)} ${suffixes[suf]}, done.\n`
  }else{
    return `Receiving objects: ${percent}% (${pos}/${total}), ${size.toFixed(2)} ${suffixes[suf]}\r`
  }
}