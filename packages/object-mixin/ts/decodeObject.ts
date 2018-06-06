import {
  Type,
  decode,
  unpackHash,
  fromDec,
  fromOct
} from '@es-git/core';

import {
  GitObject,
  BlobObject,
  TreeObject,
  CommitObject,
  TagObject,
  TreeBody,
  CommitBody,
  Person
} from './index';

export default function decodeObject(buffer : Uint8Array) : GitObject {
  const space = buffer.indexOf(0x20);
  if (space < 0) throw new Error("Invalid git object buffer");
  const nil = buffer.indexOf(0x00, space);
  if (nil < 0) throw new Error("Invalid git object buffer");
  const body = buffer.subarray(nil + 1);
  const size = fromDec(buffer, space + 1, nil);
  if (size !== body.length) throw new Error("Invalid body length.");
  const type = decode(buffer, 0, space);
  switch(type){
    case Type.blob:
      return decodeBlob(body);
    case Type.tree:
      return decodeTree(body);
    case Type.commit:
      return decodeCommit(body);
    case Type.tag:
      return decodeTag(body);
    default:
      throw new Error("Unknown type");
  }
}

export function blobToText(blob : Uint8Array) {
  return decode(blob);
}

function decodeBlob(body : Uint8Array) : BlobObject {
  return {
    type: Type.blob,
    body
  };
}

function decodeTree(body : Uint8Array) : TreeObject {
  let i = 0;
  const length = body.length;
  let start;
  let mode;
  let name;
  let hash;
  const tree : TreeBody = {};
  while (i < length) {
    start = i;
    i = body.indexOf(0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    mode = fromOct(body, start, i++);
    start = i;
    i = body.indexOf(0x00, start);
    name = decode(body, start, i++);
    hash = unpackHash(body, i, i += 20);
    tree[name] = {
      mode: mode,
      hash: hash
    };
  }

  return {
    type: Type.tree,
    body: tree
  };
}

function decodeCommit(body : Uint8Array) : CommitObject {
  let i = 0;
  let start;
  let key : keyof CommitBody | 'parent';
  const parents : string[] = [];
  const commit : any = {
    tree: "",
    parents: parents,
    author: undefined,
    committer: undefined,
    message: ""
  };
  while (body[i] !== 0x0a) {
    start = i;
    i = body.indexOf(0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    key = decode(body, start, i++) as any;
    start = i;
    i = body.indexOf(0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value = decode(body, start, i++);
    if (key === "parent") {
      parents.push(value);
    } else if (key === "author" || key === "committer") {
      commit[key] = decodePerson(value);
    } else {
      commit[key] = value;
    }
  }
  i++;
  commit.message = decode(body, i, body.length);
  return {
    type: Type.commit,
    body: commit
  };
}

function decodeTag(body : Uint8Array) : TagObject {
  let i = 0;
  let start;
  let key;
  const tag : any = {};
  while (body[i] !== 0x0a) {
    start = i;
    i = body.indexOf(0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    key = decode(body, start, i++);
    start = i;
    i = body.indexOf(0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value : any = decode(body, start, i++);
    if (key === "tagger") value = decodePerson(value);
    tag[key] = value;
  }
  i++;
  tag.message = decode(body, i, body.length);
  return {
    type: Type.tag,
    body: tag
  };
}

function decodePerson(string : string) {
  const match = string.match(/^([^<]*) <([^>]*)> ([^ ]*) (.*)$/);
  if (!match) throw new Error("Improperly formatted person string");
  return {
    name: match[1],
    email: match[2],
    date: {
      seconds: parseInt(match[3], 10),
      offset: parseInt(match[4], 10) / 100 * -60
    }
  } as Person;
}
