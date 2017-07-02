"use strict";

export enum Masks {
  mask = 0o100000,
  blob = 0o140000,
  file = 0o160000,
}

export enum Modes {
  tree   = 0o040000,
  blob   = 0o100644,
  file   = 0o100644,
  exec   = 0o100755,
  sym    = 0o120000,
  commit = 0o160000,
}

export enum Types {
  unknown = "unknown",
  commit  = "commit",
  tree    = "tree",
  blob    = "blob",
}

export function isBlob(mode : number) {
  return (mode & Masks.blob) === Masks.mask;
}

export function isFile(mode : number) {
  return (mode & Masks.file) === Masks.mask;
}
export function toType(mode : number) {
  if (mode === Modes.commit) return Types.commit;
  if (mode === Modes.tree) return Types.tree;
  if ((mode & Masks.blob) === Masks.mask) return Types.blob;
  return Types.unknown;
}

export default Modes;