# node-fs-repo

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/node-fs-repo
```

## Usage

This is an implementation of [`IRawRepo`](https://github.com/es-git/es-git/packages/core#IRawRepo) that uses the file system for storage. It uses the [node fs](https://nodejs.org/api/fs.html) and therefore really only works on the server. Use this to interface with an existing git repo created with the git cli.

**important:** you should use the [`zlib-mixin`](https://github.com/es-git/es-git/packages/zlib-mixin) if you want to load an existing git repo created with the git cli.

```ts
import Repo from '@es-git/node-fs-repo';

const repo = new Repo(__dirname + '/.git');

await repo.init();
```

#### `constructor(path : string)`

Creates the repository instance. The path parameter points to a location in the filesystem where either a repo already exists or a new one should be made.

#### `init() : Promise<void>`

Initialize a new empty repository at the path provided in the constructor.