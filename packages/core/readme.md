# core

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/core
```

## Usage

This package contains a lot of core functionality used by most of the other es-git packagase. You probably don't need to use this package directly

### IRawRepo

This interface is the core of all es-git repositories. New repositories should implement this interface, and mixins should be applied, either directly or indirectly, to this interface.

```ts
export interface IRawRepo {
  listRefs() : Promise<string[]>
  getRef(ref : string) : Promise<Hash | undefined>
  setRef(ref : string, hash : Hash | undefined) : Promise<void>
  saveRaw(hash : Hash, object : Uint8Array) : Promise<void>
  loadRaw(hash : Hash) : Promise<Uint8Array | undefined>
  hasObject(hash : Hash) : Promise<boolean>
  saveMetadata(name : string, value : Uint8Array | undefined) : Promise<void>
  loadMetadata(name : string) : Promise<Uint8Array | undefined>
}

export type Hash = string;
```

#### `listRefs() : Promise<string[]>`

Resolves a list of refs (branches and tags). This resolves the full name, for example `refs/heads/master` or `refs/tags/v1.2.3`.

#### `getRef(ref : string) : Promise<string | undefined>`

Resolves the hash that the ref points to, if it exists. If the ref does not exist, resolves `undefined`.

#### `setRef(ref : string, hash : Hash | undefined) : Promise<void>`

Set the ref to point to a hash. If the hash is `undefined`, delete the ref. The full name of the ref should be used, for example `refs/heads/master` or `refs/tags/v1.2.3`.

#### `saveRaw(hash : Hash, object : Uint8Array) : Promise<void>`

Save a git object with the hash.

#### `loadRaw(hash : Hash) : Promise<Uint8Array | undefined>`

Load a git object defined by the hash. If the object does not exist, `undefined` is resolved.

#### `hasObject(hash : Hash) : Promise<boolean>`

Resolves to `true` if the object exists in the repo, otherwise `false`.

#### `saveMetadata(name : string, value : Uint8Array | undefined) : Promise<void>`

Save metadata about the repository. If the value is `undefined`, the metadata is deleted.

#### `loadMetadata(name : string) : Promise<Uint8Array | undefined>`

Load metadata about the repository. If the metadata does not exist, resolves `undefined`.
