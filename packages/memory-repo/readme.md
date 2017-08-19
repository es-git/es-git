# memory-repo

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/memory-repo
```

## Usage

This is an implementation of [`IRawRepo`](https://github.com/es-git/es-git/packages/core#IRawRepo) that stores data in a `Map`. It is a temporary storage, it will not persist after the page refreshes or the node application is stopped. This makes it great for testing and experimenting, since it can be used with any of the mixins but does not have any side-effects.

```ts
import Repo from '@es-git/memory-repo';

const repo = new Repo();
```
