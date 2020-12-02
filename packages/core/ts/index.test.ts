import { isBlob, Mode } from './index';

test('blob is blob', () => {
  expect(isBlob(Mode.blob)).toBe(true);
})