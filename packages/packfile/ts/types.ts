
export enum Type {
  commit = 1,
  tree = 2,
  blob = 3,
  tag = 4,
  ofsDelta = 6,
  refDelta = 7
};

export type NormalEntry = {
  readonly type : Type.blob | Type.commit | Type.tag | Type.tree
  readonly body : Uint8Array
}
export type RefDeltaEntry = {
  readonly type : Type.refDelta
  readonly body : Uint8Array
  readonly ref? : string
}

export type OfsDeltaEntry = {
  readonly type : Type.ofsDelta
  readonly body : Uint8Array
  readonly ref? : number
}

export type Entry = NormalEntry | RefDeltaEntry | OfsDeltaEntry
