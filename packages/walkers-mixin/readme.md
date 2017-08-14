# walkers-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/walkers-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This mixin provides ways to walk the repo, either along it's history or in the tree of one commit. This mixin uses async iterables

```js
import objectsMixin from '@es-git/objects-mixin';
import walkersMixin from '@es-git/walkers-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(walkersMixin);

const repo = new Repo();
for await(const commit of repo.walkComits(await repo.getRef('refs/heads/master'))){
  console.log(commit.message);
}
for await(const file of repo.walkTree(await repo.getRef('refs/heads/master'))){
  console.log(file.path.join('/'));
}
```

## Interfaces

### IWalkersRepo

```js
interface IWalkersRepo {
  walkCommits(...hash : Hash[]) : AsyncIterableIterator<HashAndCommitObject>
  walkTree(hash : Hash, iterateFolders? : boolean) : AsyncIterableIterator<HashModePath>
}

type Hash = string;

type HashAndCommitObject = {
  readonly hash : Hash
  readonly commit : CommitObject
}

type HashModePath = {
  readonly hash : Hash
  readonly mode : Mode
  readonly path : string[]
}
```