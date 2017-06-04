"use strict";

export default function (repo, ms) {
  const saveAs = repo.saveAs;
  const loadAs = repo.loadAs;
  const readRef = repo.readRef;
  const updateRef = repo.updateRef;
  const createTree = repo.createTree;

  repo.saveAs = saveAsDelayed;
  repo.loadAs = loadAsDelayed;
  repo.readRef = readRefDelayed;
  repo.updateRed = updateRefDelayed;
  if (createTree) repo.createTree = createTreeDelayed;

  function saveAsDelayed(type, value, callback) {
    if (!callback) return saveAsDelayed.bind(repo, type, value);
    setTimeout(() => saveAs.call(repo, type, value, callback), ms);
  }

  function loadAsDelayed(type, hash, callback) {
    if (!callback) return loadAsDelayed.bind(repo, type, hash);
    setTimeout(() => loadAs.call(repo, type, hash, callback), ms);
  }

  function readRefDelayed(ref, callback) {
    if (!callback) return readRefDelayed.bind(repo, ref);
    setTimeout(() => readRef.call(repo, ref, callback), ms);
  }

  function updateRefDelayed(ref, hash, callback) {
    if (!callback) return updateRefDelayed.bind(repo, ref, hash);
    setTimeout(() => updateRef.call(repo, ref, hash, callback), ms);
  }

  function createTreeDelayed(entries, callback) {
    if (!callback) return createTreeDelayed.bind(repo, entries);
    setTimeout(() => createTree.call(repo, entries, callback), ms);
  }

};
