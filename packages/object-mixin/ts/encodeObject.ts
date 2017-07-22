import {
  Type,
  Mode
} from '@es-git/core';

import { TextEncoder } from 'text-encoding';

import {
  GitObject,
  TreeBody,
  TagBody,
  CommitBody,
  ModeHash,
  Person,
  SecondsWithOffset
} from './index';

const NEWLINE = '\n'.charCodeAt(0);
const encoder = new TextEncoder();

export default function encodeObject(object : GitObject) : Uint8Array {
  const bytes = getBytes(object);
  return concatenate(
    joinWithNewline(`${object.type} ${bytes.length}\0`),
    bytes);
}

export function getBytes(object : GitObject) : Uint8Array {
  switch(object.type){
    case Type.blob:
      return encodeBlob(object.body);
    case Type.tree:
      return encodeTree(object.body);
    case Type.commit:
      return encodeCommit(object.body);
    case Type.tag:
      return encodeTag(object.body);
    default:
      throw new Error(`Unknown object type`);
  }
}

export function encodeBlob(body : Uint8Array) {
  return body;
}

export function treeSort(a : {name : string, mode : Mode}, b : {name : string, mode : Mode}) {
  const aa = (a.mode === Mode.tree) ? `${a.name}/` : a.name;
  const bb = (b.mode === Mode.tree) ? `${b.name}/` : b.name;
  return aa > bb ? 1 : aa < bb ? -1 : 0;
}

export function encodeTree(body : TreeBody) {
  return joinWithNewline(...Object.keys(body)
    .map(key => ({
      name: key,
      ...body[key]
    }))
    .sort(treeSort)
    .map(entry => concatenate(encoder.encode(`${entry.mode.toString(8)} ${entry.name}\0`), encodeHex(entry.hash))));

}

export function encodeTag(body : TagBody) {
  return joinWithNewline(
    `object ${body.object}`,
    `type ${body.type}`,
    `tag ${body.tag}`,
    `tagger ${formatPerson(body.tagger)}`,
    '',
    body.message);
}

export function encodeCommit(body : CommitBody) {
  return joinWithNewline(
    `tree ${body.tree}`,
    ...body.parents.map(p => `parent ${p}`),
    `author ${formatPerson(body.author)}`,
    `committer ${formatPerson(body.committer)}`,
    '',
    body.message);
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

function concatenate(...arrays : Uint8Array[]) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
  }
  return result;
}

function joinWithNewline(...values : (string | Uint8Array)[]){
  const sum = values.reduce((sum, x) => sum + x.length, 0);
  const result = new Uint8Array(values.length-1 + sum);
  let offset = 0;
  for (const arr of values) {
    if(offset > 0){
      result.set([NEWLINE], offset++);
    }
    if(typeof(arr) === 'string'){
      result.set(encoder.encode(arr), offset);
    }else{
      result.set(arr, offset);
    }
    offset += arr.length;
  }
  return result;
}

function encodeHex(hex : string) {
  var raw = new Uint8Array(hex.length/2);
  for (let i=0; i < hex.length;) {
    raw[i/2] =
       (codeToNibble(hex.charCodeAt(i++)) << 4)
      | codeToNibble(hex.charCodeAt(i++));
  }
  return raw;
}

function codeToNibble(code : number) {
  code |= 0;
  return (code - ((code & 0x40) ? 0x57 : 0x30))|0;
}