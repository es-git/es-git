# zlib-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/zlib-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This mixin compresses the raw objects when saving and decompresses the raw objects when loading them, using zlib. This is required when using [node-fs-repo](https://www.npmjs.com/package/@es-git/node-fs-repo) to interact with a native git repository in the file-system.

```ts
import FsRepo from '@es-git/node-fs-repo';
import zlib from '@es-git/zlib-mixin';

const Repo = mix(Fs)
            .with(zlib);

const repo = new Repo(__dirname + '/.git');
```
