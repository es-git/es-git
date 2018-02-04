# fetch-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/fetch-mixin
```

## Usage

This mixin adds the ability to fetch remote branches to a local repository, using the [smart HTTP transport](https://git-scm.com/blog/2010/03/04/smart-http.html) protocol. This works well with online git hosts, like GitHub, GitLab, BitBucket and others.

```js
import fetchMixin from '@es-git/fetch-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(fetchMixin, fetch);

const repo = new Repo();

await repo.fetch('https://github.com/es-git/test-pull.git');
```

When mixing this module in with a repo you need to pass `fetch` in as a second parameter. `fetch` is available in all modern browsers and [`node-fetch`](https://www.npmjs.com/package/node-fetch) can be used server-side.

The simplest way to fetch is to provide a `url`, in which case it will fetch all remote branches (`refs/heads/*`) and store them locally (`refs/remotes/origin/*`).

You can change this by supplying one or more [refspecs](https://git-scm.com/book/en/v2/Git-Internals-The-Refspec), in the form `what/to/fetch:where/to/save/it`. If the last segment is a `*` wildcard, then it will match multiple refs.

`fetch` will return a promise that resolves when the fetch has completed. For progress report during fetch supply a `progress` function in the `options` object.

You can optionally decide to do a shallow fetch by supplying a `depth` number in the `options` object. For example, setting `depth` to `1` will fetch only the last commit. To later fetch the rest of the history, set `unshallow` to `true`. If you only want to later fetch (for example) the last 10 commits, set `unshallow` to `true` and `depth` to `10`.

If the fetch succeeds the result will be a list of fetched refs. Note that branches (refs) that are the same on the client and server will not be fetched but will be part of the result. The `name` is the branch that has been fetched (for example `refs/remotes/origin/master`), `hash` contains the hash it now points to while `oldHash`, if present, is the hash that it used to point to. If the branch didn't exist locally before the fetch, then `oldHash` is undefined. If there was nothing to fetch for the branch, then `hash` and `oldHash` will contain the same value.

`lsRemote` calls the remote endpoint and resolves to a list of references that the remote end knows about.

## Interfaces


### IPushRepo

```js
interface IFetchRepo {
  fetch(url : string, refspec? : string | string[], options? : FetchOptions) : Promise<RefChange[]>
  lsRemote(url : string) : Promise<Ref[]>
}

interface FetchOptions {
  readonly depth? : number,
  readonly unshallow? : boolean,
  readonly progress? : (message : string) => void
}

interface RefChange {
  readonly name: string;
  readonly oldHash?: string;
  readonly hash: string;
}

interface Ref {
  readonly name: string;
  readonly hash: Hash;
}
```