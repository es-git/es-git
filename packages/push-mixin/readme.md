# push-mixin

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/push-mixin
```

## Usage

Mix this in with an [IObjectRepo](https://www.npmjs.com/package/@es-git/object-mixin#IObjectRepo) and [IWalkersMixin](https://www.npmjs.com/package/@es-git/walkers-mixin#IWalkersMixin).

This mixin adds the ability to push local branches to a remote repository, using the [smart HTTP transport](https://git-scm.com/blog/2010/03/04/smart-http.html) protocol. This works well with online git hosts, like GitHub, GitLab, BitBucket and others.

```js
import objectsMixin from '@es-git/objects-mixin';
import walkersMixin from '@es-git/walkers-mixin';
import pushMixin from '@es-git/push-mixin';
import MemoryRepo from '@es-git/memory-repo';

const Repo = mix(MemoryRepo)
            .with(objectsMixin)
            .with(walkersMixin)
            .with(pushMixin, fetch);

const repo = new Repo();

// ...commit some stuff to the repo...

await repo.push('https://github.com/es-git/test-push.git', 'refs/heads/master', {username, password});
```

When mixing this module in with a repo you need to pass `fetch` in as a second parameter. `fetch` is available in all modern browsers and [`node-fetch`](https://www.npmjs.com/package/node-fetch) can be used server-side.

The simplest way to push is to provide a `url` and `ref`, but you probably need some authentication too. Authentication is done using basic authentication. When using OAuth the password is usually the `access_token`.

`push` will return a promise that resolves when the push has completed. For progress report during push supply a `progress` function in the `options` object.

The `ref` parameter controls which branches (refs) to push. When a `string` or `string[]` is supplied, the local and remote branch will have the same name (for example `refs/heads/master`). If instead an object or array of objects is supplied, then the local, remote and tracking branch names can differ. Most likely you only need to supply the `local` and `tracking` names, in which case the `remote` name will be the same as the `local`. For example, to push `refs/heads/master` to the remote and update `refs/remotes/origin/master`, supply the object `{local: 'refs/heads/master', tracking: 'refs/remotes/origin/master'}`.

If the push succeeds the result will be a list of pushed refs. Note that branches (refs) that are the same on the client and server will not be pushed and will not be part of the result. The `local`, `remote` and `tracking` (if supplied in the `ref` object, otherwise it's `undefined`) contain the names of the branches, `hash` contains the hash that all of them now point to while `oldHash` contains the hash that `remote` used to point to.

## Interfaces


### IPushRepo

```js
interface IPushRepo {
  push(url : string, ref : string, auth? : Auth, options? : PushOptions) : Promise<RefResult[]>
  push(url : string, ref : LocalRemoteTrackingRef, auth? : Auth, options? : PushOptions) : Promise<RefResult[]>
  push(url : string, ref : (string | LocalRemoteTrackingRef)[], auth? : Auth, options? : PushOptions) : Promise<RefResult[]>
}

interface Auth {
  readonly username: string;
  readonly password: string;
}

interface LocalRemoteTrackingRef {
  readonly local : string
  readonly remote? : string
  readonly tracking? : string
}

interface PushOptions {
  readonly progress? : (message : string) => void
}

interface RefResult {
  readonly local : string
  readonly remote : string
  readonly tracking? : string
  readonly hash : string
  readonly oldHash? : string
}
```