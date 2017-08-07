
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
}

export interface NormalEntry extends AbstractEntry {
  readonly type : Type.blob | Type.commit | Type.tag | Type.tree
  readonly body : Uint8Array
}
export interface RefDeltaEntry extends AbstractEntry {
  readonly type : Type.refDelta
  readonly body : Uint8Array
  readonly ref : string
}

export interface OfsDeltaEntry extends AbstractEntry {
  readonly type : Type.ofsDelta
  readonly body : Uint8Array
  readonly ref : number
}

export type Entry = NormalEntry | RefDeltaEntry | OfsDeltaEntry
