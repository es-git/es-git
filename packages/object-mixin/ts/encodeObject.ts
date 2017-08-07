import {
  Type,
  Mode,
  NEWLINE,
  encode,
  concat,
  flatten,
  packHash
} from '@es-git/core';

import {
  GitObject,
  TreeBody,
  TagBody,
  CommitBody,
  ModeHash,
  Person,
  SecondsWithOffset
} from './index';

export default function encodeObject(object : GitObject) : Uint8Array {
  const bytes = getBytes(object);
  return concat(encode(`${object.type} ${bytes.length}\0`), bytes);
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

export function textToBlob(text : string) {
  return encode(text);
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
  return concat(...flatten(Object.keys(body)
    .map(key => ({
      name: key,
      ...body[key]
    }))
    .sort(treeSort)
    .map(entry => [encode(`${entry.mode.toString(8)} ${entry.name}\0`), packHash(entry.hash)])));

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

function joinWithNewline(...values : (string | Uint8Array)[]){
  const sum = values.reduce((sum, x) => sum + x.length, 0);
  const result = new Uint8Array(values.length-1 + sum);
  let offset = 0;
  for (const arr of values) {
    if(offset > 0){
      result.set([NEWLINE], offset++);
    }
    if(typeof(arr) === 'string'){
      result.set(encode(arr), offset);
    }else{
      result.set(arr, offset);
    }
    offset += arr.length;
  }
  return result;
}
