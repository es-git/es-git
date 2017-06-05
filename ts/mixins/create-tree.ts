"use strict";

import modes from '../lib/modes.js';

import {
  IRepo,
  Type,
  Body,
  TreeBody,
  Dict,
  ModeHashName
} from '../types'

export type EntryList = (DeleteEntry | SetEntry)[];

export type DeleteEntry = {
  path : string
}

export type SetEntry = {
  path : string
  mode : number
  content : string,
  hash : string
}

export type EntriesObject = {
  [ key : string ] : Entry
}

export interface Entry {
  mode : number,
  content : string
}

export type Entries = (EntryList | EntriesObject) & { base? : string }

type Tree = {
  add : ModeHashName[]
  del : string[],
  tree : TreeBody
}

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    createTree(entries : Entries) {
      const entryList = listify(entries);

      // Tree paths that we need loaded
      const toLoad : Dict<boolean> = {};
      function markTree(path : string) {
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
      const trees : Dict<Tree> = {};

      // Counter for parallel I/O operations
      let left = 1; // One extra counter to protect again zalgo cache callbacks.

      // First pass, stubs out the trees structure, sorts adds from deletes,
      // and saves any inline content blobs.
      entryList.map(async entry => {
        const index = entry.path.lastIndexOf("/");
        const parentPath = entry.path.substr(0, index);
        const name = entry.path.substr(index + 1);
        markTree(parentPath);
        const tree = trees[parentPath];
        const adds = tree.add;
        const dels = tree.del;

        if (!(entry as any).mode) {
          dels.push(name);
          return;
        }
        const addEntry = entry as SetEntry;
        const add = {
          name: name,
          mode: addEntry.mode,
          hash: addEntry.hash
        };
        adds.push(add);
        if (addEntry.hash) return;
        left++;
        const hash = await super.saveAs("blob", addEntry.content as any);
        add.hash = hash;
        check();
      });

      // Preload the base trees
      if (entries.base) loadTree("", entries.base);

      // Check just in case there was no IO to perform
      check();

      const self = this;
      async function loadTree(path : string, hash : string) {
        left++;
        delete toLoad[path];
        const tree = await self.loadAs("tree", hash) as TreeBody;
        trees[path].tree = tree;
        Object.keys(tree).forEach(name => {
          const childPath = path ? path + "/" + name : name;
          if (toLoad[childPath]) loadTree(childPath, tree[name].hash);
        });
        check();
      }

      function check() {
        if (--left) return;
        findLeaves().forEach(processLeaf);
      }

      async function processLeaf(path : string) {
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
        const hash = await self.saveAs("tree", tree);
        if (!path) return hash;
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
      }

      function findLeaves() {
        const paths = Object.keys(trees);
        const parents : Dict<boolean> = {};
        paths.forEach(path => {
          if (!path) return;
          const parent = path.substring(0, path.lastIndexOf("/"));
          parents[parent] = true;
        });
        return paths.filter(path => !parents[path]);
      }
    }
  }
}

function listify(entries : Entries) : EntryList {
  if (Array.isArray(entries)) {
    return entries;
  }else{
    const obj = entries;
    return Object.keys(obj).map(path => {
      const entry : any = obj[path];
      entry.path = path;
      return entry;
    });
  }
}