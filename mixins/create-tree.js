"use strict";

import modes from '../lib/modes.js';

export default function (repo) {
  repo.createTree = createTree;

  function createTree(entries, callback) {
    if (!callback) return createTree.bind(null, entries);
    callback = singleCall(callback);
    if (!Array.isArray(entries)) {
      entries = Object.keys(entries).map(path => {
        const entry = entries[path];
        entry.path = path;
        return entry;
      });
    }

    // Tree paths that we need loaded
    const toLoad = {};
    function markTree(path) {
      while(true) {
        if (toLoad[path]) return;
        toLoad[path] = true;
        trees[path] = {
          add: [],
          del: [],
          tree: {}
        };
        if (!path) break;
        path = path.substring(0, path.lastIndexOf("/"));
      }
    }

    // Commands to run organized by tree path
    const trees = {};

    // Counter for parallel I/O operations
    let left = 1; // One extra counter to protect again zalgo cache callbacks.

    // First pass, stubs out the trees structure, sorts adds from deletes,
    // and saves any inline content blobs.
    entries.forEach(entry => {
      const index = entry.path.lastIndexOf("/");
      const parentPath = entry.path.substr(0, index);
      const name = entry.path.substr(index + 1);
      markTree(parentPath);
      const tree = trees[parentPath];
      const adds = tree.add;
      const dels = tree.del;

      if (!entry.mode) {
        dels.push(name);
        return;
      }
      const add = {
        name: name,
        mode: entry.mode,
        hash: entry.hash
      };
      adds.push(add);
      if (entry.hash) return;
      left++;
      repo.saveAs("blob", entry.content, (err, hash) => {
        if (err) return callback(err);
        add.hash = hash;
        check();
      });
    });

    // Preload the base trees
    if (entries.base) loadTree("", entries.base);

    // Check just in case there was no IO to perform
    check();

    function loadTree(path, hash) {
      left++;
      delete toLoad[path];
      repo.loadAs("tree", hash, (err, tree) => {
        if (err) return callback(err);
        trees[path].tree = tree;
        Object.keys(tree).forEach(name => {
          const childPath = path ? path + "/" + name : name;
          if (toLoad[childPath]) loadTree(childPath, tree[name].hash);
        });
        check();
      });
    }

    function check() {
      if (--left) return;
      findLeaves().forEach(processLeaf);
    }

    function processLeaf(path) {
      const entry = trees[path];
      delete trees[path];
      const tree = entry.tree;
      entry.del.forEach(name => {
        delete tree[name];
      });
      entry.add.forEach(item => {
        tree[item.name] = {
          mode: item.mode,
          hash: item.hash
        };
      });
      left++;
      repo.saveAs("tree", tree, (err, hash, tree) => {
        if (err) return callback(err);
        if (!path) return callback(null, hash, tree);
        const index = path.lastIndexOf("/");
        const parentPath = path.substring(0, index);
        const name = path.substring(index + 1);
        trees[parentPath].add.push({
          name: name,
          mode: modes.tree,
          hash: hash
        });
        if (--left) return;
        findLeaves().forEach(processLeaf);
      });
    }

    function findLeaves() {
      const paths = Object.keys(trees);
      const parents = {};
      paths.forEach(path => {
        if (!path) return;
        const parent = path.substring(0, path.lastIndexOf("/"));
        parents[parent] = true;
      });
      return paths.filter(path => !parents[path]);
    }
  }
};

function singleCall(callback) {
  let done = false;
  return function () {
    if (done) return console.warn("Discarding extra callback");
    done = true;
    return callback.apply(this, arguments);
  };
}
