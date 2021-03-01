# byo-fs-repo

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/byo-fs-repo
```

## Usage

This is an implementation of [`IRawRepo`](https://github.com/es-git/es-git/packages/core#IRawRepo) that uses the supplied implementation of [`IRepoFileSystem`](https://github.com/es-git/es-git/packages/byo-fs-repo#IRepoFileSystem) file system for storage. If you are using this on the server then [`node-fs-repo`](https://github.com/es-git/es-git/packages/node-fs-repo) is easier (it supplies this repo with the Node fs).

```ts
import Repo from '@es-git/byo-fs-repo';

const repo = new Repo(fs, __dirname + '/.git');

await repo.init();
```

#### `constructor(fs : IRepoFileSystem, path : string)`

Creates the repository instance. The fs parameter is the file system to use for storage and the path parameter points to a location in the filesystem where either a repo already exists or a new one should be made.

#### `init() : Promise<void>`

Initialize a new empty repository at the path provided in the constructor.

### IRepoFileSystem

This interface describes the actions taken by the repo on the underlying file system.

```ts
export interface IRepoFileSystem {
  writeFile(path : string, contents : any): Promise<any>
  readFile(path : string, encoding? : any): Promise<any>
  exists(path : string): Promise<any>
  readDir(path : string): Promise<any>
  unlink(path : string): Promise<any>
  stat(path : string): Promise<any>
  mkdir(path : string): Promise<any>
}
```
