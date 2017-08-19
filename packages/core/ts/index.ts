export {
  decode,
  encode,
  concat,
  flatten,
  fromDec,
  fromHex,
  fromOct,
  fromDecChar,
  fromHexChar,
  packHash,
  unpackHash,
  toHexChar,
  NEWLINE
} from './utils'

export enum Mask {
  mask = 0o100000,
  blob = 0o140000,
  file = 0o160000,
}

export enum Mode {
  tree   = 0o040000,
  blob   = 0o100644,
  file   = 0o100644,
  exec   = 0o100755,
  sym    = 0o120000,
  commit = 0o160000,
}

export enum Type {
  unknown = "unknown",
  commit  = "commit",
  tree    = "tree",
  blob    = "blob",
  tag     = "tag",
}

export function isBlob(mode : number) {
  return (mode & Mask.blob) === Mask.mask;
}

export function isFile(mode : number) {
  return (mode & Mask.file) === Mask.mask;
}

export function toType(mode : number) {
  if (mode === Mode.commit) return Type.commit;
  if (mode === Mode.tree) return Type.tree;
  if ((mode & Mask.blob) === Mask.mask) return Type.blob;
  return Type.unknown;
}

export interface IRawRepo {
  listRefs() : Promise<string[]>
  getRef(ref : string) : Promise<Hash | undefined>
  setRef(ref : string, hash : Hash | undefined) : Promise<void>
  saveRaw(hash : Hash, object : Uint8Array) : Promise<void>
  loadRaw(hash : Hash) : Promise<Uint8Array | undefined>
  hasObject(hash : Hash) : Promise<boolean>
  saveMetadata(name : string, value : Uint8Array | undefined) : Promise<void>
  loadMetadata(name : string) : Promise<Uint8Array | undefined>
}

export type Hash = string;

export { default as mix, Constructor, ConstructorWith, Mixin, MixinWithParam } from '@es-git/mix';

export { default as Buffer } from './Buffer';