import { RawObject } from './types';

import parsePackfile from './parse-packfile';
import normalizeEntries from './normalize-entries';

export { RawObject };

export default function unpack(chunk : Uint8Array) {
  return normalizeEntries(parsePackfile(chunk));
}