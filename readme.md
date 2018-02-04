# ES-Git

> Git implemented in EcmaScript, a fork of [JS-Git](https://github.com/creationix/js-git)

## Example

[**DEMOS**](https://es-git-examples.mariusgundersen.net/)

This basic example shows how to do low-level manipulation of an in-memory repository

```js
import { Mode, mix } from '@es-git/core';
import MemoryRepo from '@es-git/memory-repo';
import objectMixin from '@es-git/object-mixin';
import saveAsMixin from '@es-git/save-as-mixin';
import loadAsMixin from '@es-git/load-as-mixin';

async function test(){
  // Create the repository in memory and
  // enhance it using three mixins
  class Repo extends mix(MemoryRepo)
                    .with(objectMixin)
                    .with(saveAsMixin)
                    .with(loadAsMixin) {}

  // Create an instance of the repository
  const repo = new Repo();

  // Save a text file in the repo with the contents `hello`
  const hash = await repo.saveText('hello');

  // Save a folder with one file, the one we created above
  const tree = await repo.saveTree({
    'file.txt': {
      mode: Mode.file,
      hash
    }
  });

  // Commit the file and folder to the repo
  const commitHash = await repo.saveCommit({
    author: {
      name: 'Tim Caswell',
      email: 'tim@creationix.com',
      date: new Date()
    },
    committer: {
      name: 'Marius Gundersen',
      email: 'me@mariusgundersen.net',
      date: new Date()
    },
    message: 'initial commit',
    tree,
    parents: []
  });

  // Point the master branch to the commit
  await repo.setRef('refs/heads/master', commitHash);

  // Get the hash that the master branch points to
  const refHash = await repo.getRef('refs/heads/master');
  if(!refHash) throw new Error('branch does not exist');

  // Get the commit (the hash of the tree and the message) using the hash
  const {tree: treeHash, message} = await repo.loadCommit(refHash);
  console.log(message); // `initial commit`

  // Get the hash to the `file.txt' file in the tree
  const {'file.txt': {hash: fileHash}} = await repo.loadTree(treeHash);

  // Get the content of the file as a string
  const content = await repo.loadText(fileHash);
  console.log(content) // `hello`
};

test();
```

## Repositories

These are the core storage packages. They all implement IRawRepo. Pick one that fits your project, and enhance it with the mixins.

* **[idb-repo](https://www.npmjs.com/package/@es-git/idb-repo)**
* **[memory-repo](https://www.npmjs.com/package/@es-git/memory-repo)**
* **[node-fs-repo](https://www.npmjs.com/package/@es-git/node-fs-repo)**

## Mixins

These mixins add features to the repo. Some of them depend on other mixins, so the order in which the mixins are applied is significant.

* **[zlib-mixin](https://www.npmjs.com/package/@es-git/zlib-mixin)**
* **[object-mixin](https://www.npmjs.com/package/@es-git/object-mixin)**
* **[fetch-mixin](https://www.npmjs.com/package/@es-git/fetch-mixin)**
* **[cache-objects-mixin](https://www.npmjs.com/package/@es-git/cache-objects-mixin)** (depends on `object-mixin`)
* **[read-combiner-mixin](https://www.npmjs.com/package/@es-git/read-combiner-mixin)** (depends on `object-mixin`)
* **[path-to-object-mixin](https://www.npmjs.com/package/@es-git/path-to-object-mixin)** (depends on `object-mixin`)
* **[load-as-mixin](https://www.npmjs.com/package/@es-git/load-as-mixin)** (depends on `object-mixin`)
* **[save-as-mixin](https://www.npmjs.com/package/@es-git/save-as-mixin)** (depends on `object-mixin`)
* **[walkers-mixin](https://www.npmjs.com/package/@es-git/walkers-mixin)** (depends on `object-mixin`)
* **[commit-mixin](https://www.npmjs.com/package/@es-git/commit-mixin)** (depends on `object-mixin`)
* **[push-mixin](https://www.npmjs.com/package/@es-git/push-mixin)** (depends on `object-mixin` and `walkers-mixin`)
* **[checkout-mixin](https://www.npmjs.com/package/@es-git/checkout-mixin)** (depends on `object-mixin` and `walkers-mixin`)

## Other packages

* **[mix](https://www.npmjs.com/package/@es-git/mix)**
* **[node-git-proxy](https://www.npmjs.com/package/@es-git/node-git-proxy)**
* **[terminal](https://www.npmjs.com/package/@es-git/terminal)**
* **[ascii-graph-walker](https://www.npmjs.com/package/@es-git/ascii-graph-walker)**

## Relationship to [JS-Git](https://github.com/creationix/js-git)

This project is a fork of [JS-Git](https://github.com/creationix/js-git), refactored and rewritten in TypeScript. See [#132](https://github.com/creationix/js-git/issues/132) for more information.
