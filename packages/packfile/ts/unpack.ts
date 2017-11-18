import { RawObject } from './types';

import parsePackfile from './parse-packfile';
import normalizeEntries from './normalize-entries';

export { RawObject };

export default function unpack(chunks : AsyncIterableIterator<Uint8Array>) : AsyncIterableIterator<RawObject> {
  return normalizeEntries(parsePackfile(chunks));
}