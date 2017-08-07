import * as pako from 'pako';
import sha1 from 'git-sha1';
import { Buffer, unpackHash } from '@es-git/core';

import {
  Type,
  Entry
} from './types';

type $State<S extends string, T> = T & {
  readonly state : S
}

interface StartState {
  readonly buffer : Buffer
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


export default function* parsePackfile(chunk : Uint8Array) : IterableIterator<Entry> {
  let state : State = {
    state: 'start',
    buffer: new Buffer(chunk)
  };

  do {
    state = $step(state);
    if(state.state === 'entry'){
      yield state.entry;
    }
  } while(state.state !== 'done');
}

function $step(state : State){
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
      if(state.entryCount > 0){
        return $header(state);
      }else{
        return $checksum(state);
      }
    default:
      throw new Error(`Unknown state ${state}`);
  }
}

// The first four bytes in a packfile are the bytes 'PACK'
function $pack(state : State) : State {
  if(state.buffer.nextInt32() === 0x5041434b)
    return {
      ...state,
      state: 'pack'
    };
  else
    throw new Error("Invalid packfile header");
}

// The version is stored as an unsigned 32 integer in network byte order.
// It must be version 2 or 3.
function $version(state : State) : State {
  const version = state.buffer.nextInt32();
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
function $entries(state : VersionState) : State {
  const entryCount = state.buffer.nextInt32();
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
function $header(state : EntriesState) : State {
  const offset = state.buffer.pos;
  let byte = state.buffer.next();
  const type = (byte >> 4) & 0x7;
  let size = byte & 0xf;
  let left = 4;
  while (byte & 0x80) {
    byte = state.buffer.next();
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
function $ofsDelta(state : DeltaHeaderState) : State {
  return {
    ...state,
    state: 'ofs-delta',
    type: Type.ofsDelta,
    ref: varLen(state.buffer)
  };
}

// 20 byte raw sha1 hash for ref
function $refDelta(state : DeltaHeaderState) : State {
  return {
    ...state,
    state: 'ref-delta',
    type: Type.refDelta,
    ref: unpackHash(state.buffer.next(20))
  };
}

// Feed the deflated code to the inflate engine
function $body(state : HeaderState | OfsDeltaState | RefDeltaState) : State {
  const inf = new pako.Inflate();
  do {
    inf.push(state.buffer.next(1));
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
function $checksum(state : EntriesState) : State {
  const actual = sha1(state.buffer.soFar());
  const checksum = unpackHash(state.buffer.next(20));
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

function varLen(buffer : Buffer){
  let byte = buffer.next();
  let ref = byte & 0x7f;
  while (byte & 0x80) {
    byte = buffer.next();
    ref = ((ref + 1) << 7) | (byte & 0x7f);
  }
  return ref;
}