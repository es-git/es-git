# object-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/object-mixin
```

## Usage

Mix this in with an [IRawRepo](https://www.npmjs.com/package/@es-git/core#IRawRepo).

This mixin can encode objects as binary and calculate their hash before saving to an `IRawRepo`. Using the hash it can load the binary from the `IRawRepo` and then decode the object.

```js
import objectMixin from '@es-git/object-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectMixin);

const repo = new Repo();
const hash = await repo.saveObject(gitObject);
const gitObject = await repo.loadObject(hash);
```

## Interfaces

### IObjectRepo

```js
interface IObjectRepo {
  saveObject(object : GitObject) : Promise<Hash>
  loadObject(hash : Hash) : Promise<GitObject | undefined>
}
```

### GitObject
```js
type GitObject = BlobObject | TreeObject | CommitObject | TagObject;
type Body = Uint8Array | TreeBody | CommitBody | TagBody;

type Hash = string;

type BlobObject = {
  readonly type : Type.blob
  readonly body : Uint8Array
}

type TreeObject = {
  readonly type : Type.tree
  readonly body : TreeBody
}

type TreeBody = {
  [key : string] : ModeHash
}

type ModeHash = {
  readonly mode : Mode
  readonly hash : string
}

type CommitObject = {
  readonly type : Type.commit
  readonly body : CommitBody
}

type CommitBody = {
  readonly tree : string
  readonly parents : string[]
  readonly author : Person
  readonly committer : Person
  readonly message : string
}

type Person = {
  readonly name : string
  readonly email : string
  readonly date : Date | SecondsWithOffset
}

type SecondsWithOffset = {
  readonly seconds : number
  readonly offset : number
}

type TagObject = {
  readonly type : Type.tag
  readonly body : TagBody
}

type TagBody = {
  readonly object : string
  readonly type : string
  readonly tag : string
  readonly tagger : Person
  readonly message : string
}
```
