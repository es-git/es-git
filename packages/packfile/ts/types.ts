
export enum Type {
  commit = 1,
  tree = 2,
  blob = 3,
  tag = 4,
  ofsDelta = 6,
  refDelta = 7
};

export interface AbstractEntry {
  readonly offset : number
  readonly body : Uint8Array
}

export interface NormalEntry extends AbstractEntry {
  readonly type : Type.blob | Type.commit | Type.tag | Type.tree
}
export interface RefDeltaEntry extends AbstractEntry {
  readonly type : Type.refDelta
  readonly ref : string
}

export interface OfsDeltaEntry extends AbstractEntry {
  readonly type : Type.ofsDelta
  readonly ref : number
}

export type Entry = NormalEntry | RefDeltaEntry | OfsDeltaEntry

export interface RawObject {
  readonly type : string,
  readonly hash : string,
  readonly body : Uint8Array
}
