"use strict";

import * as bodec from 'bodec';
import {treeMap} from '../lib/object-codec';

import {
  IRepo,
  Type as LimitedType,
  Body,
  TreeBody,
  CommitBody,
  TagBody,
  Person,
  Dict,
  ModeHash
} from '../types'

export type Type = LimitedType | 'text' | 'array';

export interface IRepoWithFormats extends IRepo {
  loadAs(type : Type, hash : string) : Promise<Body>
}

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepoWithFormats> {
  return class extends repo implements IRepo {
    async loadAs(type : Type, hash : string) {
      const realType = type === "text" ? "blob":
                    type === "array" ? "tree" : type;
      const body = await super.loadAs(realType, hash);
      if (type === "text") return bodec.toUnicode(body as Uint8Array);
      if (type === "array") return toArray(body as TreeBody);
      return body;
    }

    async saveAs(type : Type, body : Body) {
      type = type === "text" ? "blob":
            type === "array" ? "tree" : type;
      if (type === "blob") {
        if (typeof body === "string") {
          body = bodec.fromUnicode(body);
        }
      }
      else if (type === "tree") {
        body = normalizeTree(body as TreeBody);
      }
      else if (type === "commit") {
        body = normalizeCommit(body as CommitBody);
      }
      else if (type === "tag") {
        body = normalizeTag(body as TagBody);
      }
      return await super.saveAs(type, body);
    }
  }
};

function toArray(tree : TreeBody) {
  return Object.keys(tree).map(treeMap, tree);
}

function normalizeTree(body : TreeBody) {
  const type = body && typeof body;
  if (type !== "object") {
    throw new TypeError("Tree body must be array or object");
  }
  const tree : Dict<ModeHash> = {};
  let i;
  let l;
  let entry;
  // If array form is passed in, convert to object form.
  if (Array.isArray(body)) {
    for (i = 0, l = body.length; i < l; i++) {
      entry = body[i];
      tree[entry.name] = {
        mode: entry.mode,
        hash: entry.hash
      };
    }
  }
  else {
    const names = Object.keys(body);
    for (i = 0, l = names.length; i < l; i++) {
      const name = names[i];
      entry = body[name];
      tree[name] = {
        mode: entry.mode,
        hash: entry.hash
      };
    }
  }
  return tree;
}

function normalizeCommit(body : CommitBody) {
  if (!body || typeof body !== "object") {
    throw new TypeError("Commit body must be an object");
  }
  if (!(body.tree && body.author && body.message)) {
    throw new TypeError("Tree, author, and message are required for commits");
  }
  const parents = body.parents || (body.parent ? [ body.parent ] : []);
  if (!Array.isArray(parents)) {
    throw new TypeError("Parents must be an array");
  }
  const author = normalizePerson(body.author);
  const committer = body.committer ? normalizePerson(body.committer) : author;
  return {
    tree: body.tree,
    parents: parents,
    author: author,
    committer: committer,
    message: body.message
  };
}

function normalizeTag(body : TagBody) {
  if (!body || typeof body !== "object") {
    throw new TypeError("Tag body must be an object");
  }
  if (!(body.object && body.type && body.tag && body.tagger && body.message)) {
    throw new TypeError("Object, type, tag, tagger, and message required");
  }
  return {
    object: body.object,
    type: body.type,
    tag: body.tag,
    tagger: normalizePerson(body.tagger),
    message: body.message
  };
}

function normalizePerson(person : Person) {
  if (!person || typeof person !== "object") {
    throw new TypeError("Person must be an object");
  }
  if (typeof person.name !== "string" || typeof person.email !== "string") {
    throw new TypeError("Name and email are required for person fields");
  }
  return {
    name: person.name,
    email: person.email,
    date: person.date || new Date()
  };
}
