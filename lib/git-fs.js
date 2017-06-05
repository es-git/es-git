"use strict";

import modes from './modes';

// options.encrypt(plain) -> encrypted
// options.decrypt(encrypted) -> plain
// options.shouldEncrypt(path) -> boolean
// options.getRootTree() => hash
// options.setRootTree(hash) =>
export default function (repo, options) {
  const toWrite = {};
  let writing = null;

  return {
    readFile: readFile,
    writeFile: writeFile,
    readDir: readDir
  };

  async function readFile(path) {
    // If there is a pending write for this path, pull from the cache.
    if (toWrite[path]) return toWrite[path];

    // Otherwise read from the persistent storage
    const hash = await options.getRootTree();
    const entry = await repo.pathToEntry(hash, path);

    if (!entry || !modes.isBlob(entry.mode)) throw new Error(`${path}, with hash ${hash}, is not a blob, cannot be read as file`);

    const content = await repo.loadAs("blob", entry.hash);
    if (entry.mode === modes.sym) {
      return options.decrypt(content);
    }
    return content;
  }

  async function writeFile(path, binary) {
    toWrite[path] = binary;
    return await check();
  }

  async function readDir(path) {
    const hash = await options.getRootTree();

    const entry = await repo.pathToEntry(hash, path);

    if (!entry || entry.mode !== modes.tree) throw new Error(`${path}, with hash ${hash}, is not a tree, cannot be read as directory`);
    const tree = await repo.loadAs("tree", entry.hash);

    return Object.keys(tree)
  }

  async function check() {
    if (!writing){
      writing = writeFiles();
    }
    return await writing;
  }

  async function writeFiles(){
    const base = await options.getRootTree();
    const files = pullFiles();
    const hash = await repo.createTree({
      ...files,
      base
    });

    await options.setRootTree(hash);

    writing = null;
  }

  function pullFiles() {
    const files = Object.keys(toWrite).map(path => {
      let content = toWrite[path];
      delete toWrite[path];
      let mode = modes.blob;
      if (options.shouldEncrypt && options.shouldEncrypt(path)) {
        mode = modes.sym;
        content = options.encrypt(content);
      }
      return {
        path: path,
        mode: mode,
        content: content
      };
    });
    return files;
  }
};
