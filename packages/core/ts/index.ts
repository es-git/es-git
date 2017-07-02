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
  tag     = "tag",
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

export interface IRawRepo {
  readRef(ref : string) : Promise<string | undefined>
  updateRef(ref : string, hash : string) : Promise<void>
  hasHash(hash : string) : Promise<boolean>
  saveRaw(raw : RawObject) : Promise<void>
  loadRaw(hash : string) : Promise<RawObject | undefined>
}

export type SecondsWithOffset = {
  readonly seconds : number
  readonly offset : number
}

export type Person = {
  readonly name : string
  readonly email : string
  readonly date : Date | SecondsWithOffset
}

export type ModeHash = {
  readonly mode : number
  readonly hash : string
}

export type BlobFrame = {
  readonly type : Types.blob
  readonly body : Uint8Array
}

export type TreeFrame = {
  readonly type : Types.tree
  readonly body : TreeBody
}

export type TreeBody = {
  [key : string] : ModeHash
}

export type CommitFrame = {
  readonly type : Types.commit
  readonly body : CommitBody
}

export type CommitBody = {
  readonly tree : string
  readonly parents : string[]
  readonly parent? : string
  readonly author : Person
  readonly committer : Person
  readonly message : string
}

export type TagFrame = {
  readonly type : Types.tag
  readonly body : TagBody
}

export type TagBody = {
  readonly object : string
  readonly type : string
  readonly tag : string
  readonly tagger : Person
  readonly message : string
}

export type Body = Uint8Array | TreeBody | CommitBody | TagBody;
export type Frame = BlobFrame | TreeFrame | CommitFrame | TagFrame;
export type RawObject = {hash : string} & Frame;
