# idb-repo

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/idb-repo
```

## Usage

This is an implementation of [`IRawRepo`](https://github.com/es-git/es-git/packages/core#IRawRepo) that uses [IndexedDB](https://developer.mozilla.org/en/docs/Web/API/IndexedDB_API) as a storage mechanism. For better async support it is implemented using [IDB](https://github.com/jakearchibald/idb). This is meant to be used in browsers.

In addition to exporting an implementation of `IRawRepo` this package also exports an `init` method.

```ts
import Repo, {init} from '@es-git/idb-repo';

const db = init('my-repository');

const repo = new Repo(db);
```

#### `init(name? : string) : Promise<DB>`

Call this function to create a database that can be used by the repository.

#### `constructor(db : DB)`

The constructor takes one argument, an open database.