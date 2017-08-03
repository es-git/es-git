import { Constructor, Hash, Type } from '@es-git/core';
import { IObjectRepo, TreeBody, CommitBody, TagBody, blobToText } from '@es-git/object-mixin';

export interface ILoadAsRepo {
  loadBlob(hash : Hash) : Promise<Uint8Array>
  loadText(hash : Hash) : Promise<string>
  loadTree(hash : Hash) : Promise<TreeBody>
  loadCommit(hash : Hash) : Promise<CommitBody>
  loadTag(hash : Hash) : Promise<TagBody>
}

export default function loadAsMixin<T extends Constructor<IObjectRepo>>(repo : T)
: T & Constructor<ILoadAsRepo> {
  return class LoadAsRepo extends repo implements ILoadAsRepo {
    async loadBlob(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.blob) throw new Error(`Expected object with hash ${hash} to be blob but it was ${object.type}`);
      return object.body;
    }

    async loadText(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.blob) throw new Error(`Expected object with hash ${hash} to be blob but it was ${object.type}`);
      return blobToText(object.body);
    }

    async loadTree(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.tree) throw new Error(`Expected object with hash ${hash} to be tree but it was ${object.type}`);
      return object.body;
    }

    async loadCommit(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.commit) throw new Error(`Expected object with hash ${hash} to be commit but it was ${object.type}`);
      return object.body;
    }

    async loadTag(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.tag) throw new Error(`Expected object with hash ${hash} to be tag but it was ${object.type}`);
      return object.body;
    }
  }
}