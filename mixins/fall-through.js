import modes from '../lib/modes';

export default function (local, remote) {
  const loadAs = (type, hash) => local.loadAs(type, hash);
  local.loadAs = newLoadAs;
  async function newLoadAs(type, hash) {
    const body = await loadAs(type, hash);
    if (body === undefined) return await remote.loadAs(type, hash);
  }

  const readRef = ref => local.readRef(ref);
  local.readRef = newReadRef;
  async function newReadRef(ref) {
    const body = await readRef(ref);
    if (body === undefined) return await remote.readRef(ref);
  }
};
