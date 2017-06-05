

export interface StringMap {
  [key : string] : string
}

export interface IRepo {
  readRef(ref : string) : Promise<string>
  updateRef(ref : string, hash : string) : Promise<void>
  hasHash(hash : string) : Promise<boolean>
  saveAs(type : Type, body : Body) : Promise<string>
  saveRaw(hash : string, buffer : Uint8Array) : Promise<void>
  loadAs(type : Type, hash : string) : Promise<Body>
  loadRaw(hash : string) : Promise<Uint8Array>
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

export type ModeHashName = ModeHash & {
  readonly name : string
}

export type BlobFrame = {
  readonly type : 'blob'
  readonly body : Uint8Array
}

export type TreeFrame = {
  readonly type : 'tree'
  readonly body : TreeBody
}

export type TreeBody = {
  [key : string] : ModeHash
}

export type CommitFrame = {
  readonly type : 'commit'
  readonly body : CommitBody
}

export type CommitBody = {
  readonly tree : string
  readonly parents : string[]
  readonly author : Person
  readonly committer : Person
  readonly message : string
}

export type TagFrame = {
  readonly type : 'tag'
  readonly body : TagBody
}

export type TagBody = {
  readonly object : string
  readonly type : string
  readonly tag : string
  readonly tagger : Person
  readonly message : string
}

export type Type = 'blob' | 'tree' | 'commit' | 'tag';
export type Frame = BlobFrame | TreeFrame | CommitFrame | TagFrame;
export type Body = Uint8Array | TreeBody | CommitBody | TagBody;