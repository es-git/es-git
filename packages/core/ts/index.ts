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
  listRefs() : Promise<Hash[]>
  getRef(ref : string) : Promise<Hash | undefined>
  setRef(ref : string, hash : Hash) : Promise<void>
  deleteRef(ref : string) : Promise<void>
  saveRaw(hash : Hash, object : Uint8Array) : Promise<void>
  loadRaw(hash : Hash) : Promise<Uint8Array | undefined>
}

export type Hash = string;

export type Constructor<T> = new(...args: any[]) => T;

export interface ConstructorWith<T> {
  new(...args: any[]) : T;
  with<T2>(mixin : Mixin<T, T2>) : ConstructorWith<T & T2>
};

export type Mixin<T1, T2> = (base : Constructor<T1>) => Constructor<T2> & Constructor<T1>;

export function mix<T>(base : Constructor<T>){
  const baseWith = base as ConstructorWith<T>;
  baseWith.with = <TWith>(mixin : Mixin<T, TWith>) => mix<T & TWith>(mixin(base));
  return baseWith;
}

export { default as Buffer } from './Buffer';
export { default as AsyncBuffer } from './AsyncBuffer';