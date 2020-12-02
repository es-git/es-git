import MemoryRepo from './index';

const repo = new MemoryRepo();

test('SaveRaw then loadRaw', async () => {
  const object = new Uint8Array(100);
  await repo.saveRaw('1234', object);
  const loaded = await repo.loadRaw('1234');
  expect(loaded).toBe(object);
});