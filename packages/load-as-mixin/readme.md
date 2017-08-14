# load-as-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/load-as-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This mixin makes it easier to load objects from the repo. Each method takes a hash and attempts to load the object with that hash. If the object does not exist or is not of the type exected, an `Error` is thrown.

```js
import objectsMixin from '@es-git/objects-mixin';
import loadAsMixin from '@es-git/load-as-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(loadAsMixin);

const repo = new Repo();
const text = await repo.loadText(hash);
const tree = await repo.loadTree(hash);
```

## Interfaces

### ILoadAsRepo

```js
interface ILoadAsRepo {
  loadBlob(hash : Hash) : Promise<Uint8Array>
  loadText(hash : Hash) : Promise<string>
  loadTree(hash : Hash) : Promise<TreeBody>
  loadCommit(hash : Hash) : Promise<CommitBody>
  loadTag(hash : Hash) : Promise<TagBody>
}

type Hash = string;

type TreeBody = {
  [key : string] : ModeHash
}

type ModeHash = {
  readonly mode : Mode
  readonly hash : string
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

type TagBody = {
  readonly object : string
  readonly type : string
  readonly tag : string
  readonly tagger : Person
  readonly message : string
}
```