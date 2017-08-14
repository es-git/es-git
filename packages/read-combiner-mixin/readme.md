# read-combiner-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/read-combiner-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo).

This is a performance enhancing mixin. If reads for the same object are made at the same time, this mixin wil ensure that only one read is made to the repo.

```js
import objectsMixin from '@es-git/objects-mixin';
import readCombinerMixin from '@es-git/read-combiner-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(readCombinerMixin);

const repo = new Repo();
const [object1, object2, object3] = await Promise.all([
  repo.loadObject(hash),
  repo.loadObject(hash),
  repo.loadObject(hash)
]);
```

## Interfaces

This mixin does not enhance the repo in any observable way, it only wraps the `loadObject` methody