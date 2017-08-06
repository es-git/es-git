import * as pako from 'pako';
import sha1 from 'git-sha1';
import { TextEncoder, TextDecoder } from 'text-encoding';

import {
  Type,
  Entry
} from './types';

import Buffer from './buffer';

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
  readonly entries : Entry[]
}

interface HeaderState extends EntriesState {
  readonly type : Type.blob | Type.commit | Type.tag | Type.tree
  readonly size : number
}

interface DeltaHeaderState extends EntriesState {
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
  $State<'done', ChecksumState>;


export default function unpack(chunk : Uint8Array) {
  let state : State = {
    state: 'start',
    buffer: new Buffer(chunk)
  };

  do {
    state = $step(state);
  } while(state.state !== 'done');

  return state.entries;
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
      if(state.entries.length < state.entryCount){
        return $header(state);
      }else{
        return $checksum(state);
      }
    case 'ofs-header':
      return $ofsDelta(state);
    case 'ref-header':
      return $refDelta(state);
    case 'header':
    case 'ofs-delta':
    case 'ref-delta':
      return $body(state);
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
    entryCount,
    entries: []
  };
}

// n-byte type and length (3-bit type, (n-1)*7+4-bit length)
// CTTTSSSS
// C is continue bit, TTT is type, S+ is length
// Second state in the same header parsing.
// CSSSSSSS*
function $header(state : EntriesState) : State {
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
      size
    }
  }else if(type === 7){
    return {
      ...state,
      state: 'ref-header',
      size
    }
  }else{
    return {
      ...state,
      state: 'header',
      type,
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
    ref: toHex(state.buffer.next(20))
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
  const entries = [
    ...state.entries,
    entry(state, data)
  ];

  return {
    ...state,
    state: 'entries',
    entries
  }
}

// 20 byte checksum
function $checksum(state : EntriesState) : State {
  const actual = sha1(state.buffer.soFar());
  const checksum = toHex(state.buffer.next(20));
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
      body
    };
  }else if(state.type == Type.refDelta){
    return {
      type: Type.refDelta,
      ref: state.ref,
      body
    };
  }else{
    return {
      type: state.type,
      body
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

function concatenate(...arrays : Uint8Array[]) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
  }
  return result;
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