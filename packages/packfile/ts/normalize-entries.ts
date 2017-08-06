import {
  Type,
  Entry,
  NormalEntry,
  OfsDeltaEntry,
  RefDeltaEntry
} from './types';
import applyDelta from './apply-delta';
import sha1 from 'git-sha1';

export default function *normalizeEntries(entries : IterableIterator<Entry>) : IterableIterator<NormalEntry> {
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
        hash: sha1(body),
        offset: entry.offset
      };
    }

    references.set(entry.hash, entry);
    offsets.set(entry.offset, entry);
    yield entry;
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