"use strict";

export default function (repo, ms) {
  const saveAs = (type, value) => repo.saveAs(type, value);
  const loadAs = (type, hash) => repo.loadAs(type, hash);
  const readRef = ref => repo.readRef(ref);
  const updateRef = (ref, hash) => repo.updateRef(ref, hash);
  const createTree = entries => repo.createTree(entries);

  repo.saveAs = saveAsDelayed;
  repo.loadAs = loadAsDelayed;
  repo.readRef = readRefDelayed;
  repo.updateRed = updateRefDelayed;
  if (createTree) repo.createTree = createTreeDelayed;

  async function saveAsDelayed(type, value) {
    await delay(ms);
    return await saveAs(type, value);
  }

  async function loadAsDelayed(type, hash) {
    await delay(ms);
    return await loadAs(type, hash);
  }

  async function readRefDelayed(ref) {
    await delay(ms);
    return await readRef(ref);
  }

  async function updateRefDelayed(ref, hash) {
    await delay(ms);
    return await updateRef(ref, hash);
  }

  async function createTreeDelayed(entries) {
    await delay(ms);
    return await createTree(entries);
  }
};

function delay(ms){
  return new Promise(res => setTimeout(res, ms));
}