import {
  concat,
  encode,
  Hash
} from '@es-git/core'

import {
  Type,
  Entry,
  NormalEntry,
  OfsDeltaEntry,
  RefDeltaEntry
} from './types';
import applyDelta from './apply-delta';
import sha1 from 'git-sha1';

export interface RawObject {
  readonly type : string,
  readonly hash : Hash,
  readonly body : Uint8Array
}

export default function *normalizeEntries(entries : IterableIterator<Entry>) : IterableIterator<RawObject> {
  const references = new Map<string, NormalEntry>();
  const offsets = new Map<number, NormalEntry>();

  for(let entry of entries){
    if(entry.type === Type.ofsDelta
    || entry.type === Type.refDelta){
      const base = getBase(entry);
      const body = applyDelta(entry.body, base.body)
      entry = {
        type: base.type,
        body,
        offset: entry.offset
      };
    }

    const type = Type[entry.type];
    const body = encodeRaw(type, entry.body);
    const hash = sha1(body);

    references.set(hash, entry);
    offsets.set(entry.offset, entry);
    yield {
      type,
      body,
      hash
    };
  }

  function getBase(entry : OfsDeltaEntry | RefDeltaEntry) {
    if(entry.type === Type.ofsDelta) {
      const base = offsets.get(entry.offset - entry.ref);
      if(!base) throw new Error(`Cannot find base of ofs-delta ${entry.offset} - ${entry.ref}`);
      return base;
    } else {
      const base = references.get(entry.ref);
      if(!base) throw new Error(`Cannot find base of ref-delta ${entry.offset}: ${entry.ref}`);
      //ToDo: thinpack lookup
      return base;
    }
  }
}

export function encodeRaw(type : string, bytes : Uint8Array){
  return concat(encode(`${type} ${bytes.length}\0`), bytes);
}