import {
  concat,
  encode,
  sha1
} from '@es-git/core'

import {
  Type,
  Entry,
  NormalEntry,
  OfsDeltaEntry,
  RefDeltaEntry,
  RawObject,
  Progress
} from './types';
import applyDelta from './apply-delta';

export default async function *normalizeEntries(entries : AsyncIterableIterator<Entry>, progress? : Progress) : AsyncIterableIterator<RawObject> {
  const references = new Map<string, NormalEntry>();
  const offsets = new Map<number, NormalEntry>();
  let deltas = 0;

  for await(let entry of entries){
    if(entry.type === Type.ofsDelta
    || entry.type === Type.refDelta){
      const base = getBase(entry);
      const body = applyDelta(entry.body, base.body)
      deltas++;
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

  if(progress) progress(`Resolving deltas: 100% (${deltas}/${deltas}), done.\n`);

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