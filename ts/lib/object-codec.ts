"use strict";
import * as bodec from 'bodec';
import modes from './modes';

import {
  Frame,
  BlobFrame,
  TreeBody,
  TagBody,
  CommitBody,
  ModeHash,
  ModeHashName,
  Person,
  SecondsWithOffset
} from '../types';

const encoders = {
  blob: encodeBlob,
  tree: encodeTree,
  commit: encodeCommit,
  tag: encodeTag
};

// (body) -> raw-buffer
export {encoders};

// ({type:type, body:raw-buffer}) -> buffer
export {frame};

const decoders = {
  blob: decodeBlob,
  tree: decodeTree,
  commit: decodeCommit,
  tag: decodeTag
};

// (raw-buffer) -> body
export {decoders}

// (buffer) -> {type:type, body:raw-buffer}
export {deframe};

// Export git style path sort in case it's wanted.
export {treeMap};

export {treeSort};

function encodeBlob(body : Uint8Array) {
  if (!bodec.isBinary(body)) throw new TypeError("Blobs must be binary values");
  return body;
}

function treeMap(this : TreeBody, key : string) {
  /*jshint validthis:true*/
  const entry = this[key];
  return {
    name: key,
    mode: entry.mode,
    hash: entry.hash
  };
}

function treeSort(a : ModeHashName, b : ModeHashName) {
  const aa = (a.mode === modes.tree) ? a.name + "/" : a.name;
  const bb = (b.mode === modes.tree) ? b.name + "/" : b.name;
  return aa > bb ? 1 : aa < bb ? -1 : 0;
}

function encodeTree(body : TreeBody) {
  let tree = "";
  if (Array.isArray(body)) throw new TypeError("Tree must be in object form");
  const list = Object.keys(body).map(treeMap, body).sort(treeSort);
  for (let i = 0, l = list.length; i < l; i++) {
    const entry = list[i];
    tree += entry.mode.toString(8) + " " + bodec.encodeUtf8(entry.name) +
            "\0" + bodec.decodeHex(entry.hash);
  }
  return bodec.fromRaw(tree);
}

function encodeTag(body : TagBody) {
  const str = "object " + body.object +
    "\ntype " + body.type +
    "\ntag " + body.tag +
    "\ntagger " + formatPerson(body.tagger) +
    "\n\n" + body.message;
  return bodec.fromUnicode(str);
}

function encodeCommit(body : CommitBody) {
  let str = "tree " + body.tree;
  for (let i = 0, l = body.parents.length; i < l; ++i) {
    str += "\nparent " + body.parents[i];
  }
  str += "\nauthor " + formatPerson(body.author) +
         "\ncommitter " + formatPerson(body.committer) +
         "\n\n" + body.message;
  return bodec.fromUnicode(str);
}


function formatPerson(person : Person) {
  return safe(person.name) +
    " <" + safe(person.email) + "> " +
    formatDate(person.date);
}

function safe(string : string) {
  return string.replace(/(?:^[\.,:;<>"']+|[\0\n<>]+|[\.,:;<>"']+$)/gm, "");
}

function two(num : number) {
  return (num < 10 ? "0" : "") + num;
}

function formatDate(date : Date | SecondsWithOffset) {
  let seconds, offset;
  if (isSecondsWithOffset(date)) {
    seconds = date.seconds;
    offset = date.offset;
  }
  // Also accept Date instances
  else {
    seconds = Math.floor(date.getTime() / 1000);
    offset = date.getTimezoneOffset();
  }
  let neg = "+";
  if (offset <= 0) offset = -offset;
  else neg = "-";
  offset = neg + two(Math.floor(offset / 60)) + two(offset % 60);
  return seconds + " " + offset;
}

function isSecondsWithOffset(value : Date | SecondsWithOffset) : value is SecondsWithOffset {
  return (value as any).seconds;
}

function frame(obj : Frame) {
  const type = obj.type;
  const body = bodec.isBinary(obj.body) ? obj.body : (encoders as any)[type](obj.body) as Uint8Array;
  return bodec.join([
    bodec.fromRaw(type + " " + body.length + "\0"),
    body
  ]);
}

function decodeBlob(body : Uint8Array) {
  return body;
}

function decodeTree(body : Uint8Array) {
  let i = 0;
  const length = body.length;
  let start;
  let mode;
  let name;
  let hash;
  const tree : TreeBody = {};
  while (i < length) {
    start = i;
    i = indexOf(body, 0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    mode = parseOct(body, start, i++);
    start = i;
    i = indexOf(body, 0x00, start);
    name = bodec.toUnicode(body, start, i++);
    hash = bodec.toHex(body, i, i += 20);
    tree[name] = {
      mode: mode,
      hash: hash
    };
  }
  return tree;
}

function decodeCommit(body : Uint8Array) {
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
    i = indexOf(body, 0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    key = bodec.toRaw(body, start, i++) as any;
    start = i;
    i = indexOf(body, 0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value = bodec.toUnicode(body, start, i++);
    if (key === "parent") {
      parents.push(value);
    }
    else {
      if (key === "author" || key === "committer") {
        commit[key] = decodePerson(value);
      }
      commit[key] = value;
    }
  }
  i++;
  commit.message = bodec.toUnicode(body, i, body.length);
  return commit as CommitBody;
}

function decodeTag(body : Uint8Array) {
  let i = 0;
  let start;
  let key;
  const tag : any = {};
  while (body[i] !== 0x0a) {
    start = i;
    i = indexOf(body, 0x20, start);
    if (i < 0) throw new SyntaxError("Missing space");
    key = bodec.toRaw(body, start, i++);
    start = i;
    i = indexOf(body, 0x0a, start);
    if (i < 0) throw new SyntaxError("Missing linefeed");
    let value : any = bodec.toUnicode(body, start, i++);
    if (key === "tagger") value = decodePerson(value);
    tag[key] = value;
  }
  i++;
  tag.message = bodec.toUnicode(body, i, body.length);
  return tag as TagBody;
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

function deframe(buffer : Uint8Array, decode? : boolean) : Frame {
  const space = indexOf(buffer, 0x20);
  if (space < 0) throw new Error("Invalid git object buffer");
  const nil = indexOf(buffer, 0x00, space);
  if (nil < 0) throw new Error("Invalid git object buffer");
  const body = bodec.slice(buffer, nil + 1);
  const size = parseDec(buffer, space + 1, nil);
  if (size !== body.length) throw new Error("Invalid body length.");
  const type = bodec.toRaw(buffer, 0, space);
  return {
    type: type,
    body: decode ? (decoders as any)[type](body) : body
  } as any;
}

function indexOf(buffer : Uint8Array, byte : number, i = 0) {
  i |= 0;
  const length = buffer.length;
  for (;;i++) {
    if (i >= length) return -1;
    if (buffer[i] === byte) return i;
  }
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
