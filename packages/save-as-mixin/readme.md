# save-as-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/save-as-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This mixin makes it easier to save objects to the repo.

```js
import objectsMixin from '@es-git/objects-mixin';
import saveAsMixin from '@es-git/save-as-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(saveAsMixin);

const repo = new Repo();
const hash = await repo.saveText('hello');
const tree = await repo.saveTree({
  'file1.txt': { mode: Mode.File, hash }
});
```

## Interfaces

### ISaveAsRepo

```js
interface ISaveAsRepo {
  saveBlob(blob : Uint8Array) : Promise<Hash>
  saveText(text : string) : Promise<Hash>
  saveTree(tree : TreeBody) : Promise<Hash>
  saveCommit(commit : CommitBody) : Promise<Hash>
  saveTag(tag : TagBody) : Promise<Hash>
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