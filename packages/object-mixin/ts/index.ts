import { Type, Mode, Constructor, IRawRepo } from '@es-git/core';
import sha1 from 'git-sha1';

import encodeObject from './encodeObject';
import decodeObject from './decodeObject';

export default function mixin<T extends Constructor<IRawRepo>>(repo : T) : Constructor<IObjectRepo> & T {
  return class ObjectRepo extends repo implements IObjectRepo {
    constructor(...args : any[]){
      super(...args);
    }

    async saveObject(object : GitObject) {
      const raw = encodeObject(object);
      const hash = sha1(raw);
      await super.saveRaw(hash, raw);
      return hash;
    }

    async loadObject(hash : Hash) {
      const raw = await super.loadRaw(hash);
      return raw ? decodeObject(raw) : undefined;
    }
  }
}

export interface IObjectRepo {
  saveObject(object : GitObject) : Promise<Hash>
  loadObject(hash : Hash) : Promise<GitObject | undefined>
}

export type Hash = string;

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
  readonly mode : Mode
  readonly hash : string
}

export type BlobObject = {
  readonly type : Type.blob
  readonly body : Uint8Array
}

export type TextObject = {
  readonly type : 'text'
  readonly body : string
}

export type TreeObject = {
  readonly type : Type.tree
  readonly body : TreeBody
}

export type TreeBody = {
  [key : string] : ModeHash
}

export type CommitObject = {
  readonly type : Type.commit
  readonly body : CommitBody
}

export type CommitBody = {
  readonly tree : string
  readonly parents : string[]
  readonly author : Person
  readonly committer : Person
  readonly message : string
}

export type TagObject = {
  readonly type : Type.tag
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
export type GitObject = TextObject | BlobObject | TreeObject | CommitObject | TagObject;
