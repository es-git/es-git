import { RawObject, Progress } from './types';

import parsePackfile from './parse-packfile';
import normalizeEntries from './normalize-entries';
import pipe from './pipe';

export { RawObject };

export default async function* unpack(chunks : AsyncIterableIterator<Uint8Array>, progress? : Progress) : AsyncIterableIterator<RawObject> {
  yield* pipe(chunks)
        .pipe(c => parsePackfile(c, progress))
        .pipe(c => normalizeEntries(c, progress));
}