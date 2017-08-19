# path-to-object-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/path-to-object-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This mixin makes it easier to load an object from a commit by path. Provide the hash of the tree and the path, either as a string or as an array of string segments. It returns either a tree, a blob or, if nothing is found, undefined.

```js
import objectsMixin from '@es-git/objects-mixin';
import pathToObject from '@es-git/path-to-object-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(pathToObject);

const repo = new Repo();
const object = await repo.loadObjectByPath(hash, 'folder/directory/file.txt');
const object = await repo.loadObjectByPath(hash, ['folder', 'directory', 'file.txt']);

const content = await repo.loadTextByPath(hash, ['folder', 'directory', 'file.txt']);
```

## Interfaces

### IPathToObjectRepo

```js
interface IPathToObjectRepo {
  loadObjectByPath(rootTree : Hash, path : string | string[]) : Promise<TreeObject | BlobObject | undefined>
  loadBlobByPath(rootTree : Hash, path : string | string[]) : Promise<Uint8Array | undefined>
  loadTextByPath(rootTree : Hash, path : string | string[]) : Promise<string | undefined>
}
```

### GitObject

```js
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
```