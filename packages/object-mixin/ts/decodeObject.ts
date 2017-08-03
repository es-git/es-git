import {
  Type,
  Mode
} from '@es-git/core';

import { TextDecoder } from 'text-encoding';

import {
  GitObject,
  BlobObject,
  TreeObject,
  CommitObject,
  TagObject,
  TreeBody,
  TagBody,
  CommitBody,
  ModeHash,
  Person,
  SecondsWithOffset
} from './index';

const decoder = new TextDecoder();

export default function decodeObject(buffer : Uint8Array) : GitObject {
  const space = buffer.indexOf(0x20);
  if (space < 0) throw new Error("Invalid git object buffer");
  const nil = buffer.indexOf(0x00, space);
  if (nil < 0) throw new Error("Invalid git object buffer");
  const body = buffer.subarray(nil + 1);
  const size = parseDec(buffer, space + 1, nil);
  if (size !== body.length) throw new Error("Invalid body length.");
  const type = decodeSubarray(buffer, 0, space);
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
  return decoder.decode(blob);
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
    mode = parseOct(body, start, i++);
    start = i;
    i = body.indexOf(0x00, start);
    name = decodeSubarray(body, start, i++);
    hash = toHex(body, i, i += 20);
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
    key = decodeSubarray(body, start, i++) as any;
    start = i;
    i = body.indexOf(0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value = decodeSubarray(body, start, i++);
    if (key === "parent") {
      parents.push(value);
    } else if (key === "author" || key === "committer") {
      commit[key] = decodePerson(value);
    } else {
      commit[key] = value;
    }
  }
  i++;
  commit.message = decodeSubarray(body, i, body.length);
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
    key = decodeSubarray(body, start, i++);
    start = i;
    i = body.indexOf(0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value : any = decodeSubarray(body, start, i++);
    if (key === "tagger") value = decodePerson(value);
    tag[key] = value;
  }
  i++;
  tag.message = decodeSubarray(body, i, body.length);
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

function parseOct(buffer : Uint8Array, start : number, end : number) {
  let val = 0;
  while (start < end) {
    val = (val << 3) + buffer[start++] - 0x30;
  }
  return val;
}

function parseDec(buffer : Uint8Array, start : number, end : number) {
  let val = 0;
  while (start < end) {
    val = val * 10 + buffer[start++] - 0x30;
  }
  return val;
}

function decodeSubarray(binary : Uint8Array, start = 0, end = binary.length) {
  return decoder.decode(binary.subarray(start, end));
}

function toHex(binary : Uint8Array, start = 0, end = binary.length) {
  var hex = "";
  for (var i = start; i < end; i++) {
    var byte = binary[i];
    hex += String.fromCharCode(nibbleToCode(byte >> 4)) +
           String.fromCharCode(nibbleToCode(byte & 0xf));
  }
  return hex;
}

function nibbleToCode(nibble : number) {
  nibble |= 0;
  return (nibble + (nibble < 10 ? 0x30 : 0x57))|0;
}