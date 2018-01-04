import { RawObject, Progress } from './types';

import parsePackfile from './parse-packfile';
import normalizeEntries from './normalize-entries';

export { RawObject };

export default function unpack(chunks : AsyncIterableIterator<Uint8Array>, progress? : Progress) : AsyncIterableIterator<RawObject> {
  return normalizeEntries(parsePackfile(chunks, progress), progress);
}