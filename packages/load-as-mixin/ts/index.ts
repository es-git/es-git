import { Constructor, Hash, Type } from '@es-git/core';
import { IObjectRepo, GitObject, BlobObject, TextObject, TreeObject, CommitObject, TagObject, blobToText } from '@es-git/object-mixin';

export interface ILoadAsRepo {
  loadBlob(hash : Hash) : Promise<BlobObject>
  loadText(hash : Hash) : Promise<TextObject>
  loadTree(hash : Hash) : Promise<TreeObject>
  loadCommit(hash : Hash) : Promise<CommitObject>
  loadTag(hash : Hash) : Promise<TagObject>
}

export default function loadAsMixin<T extends Constructor<IObjectRepo>>(repo : T)
: T & Constructor<ILoadAsRepo> {
  return class LoadAsRepo extends repo implements ILoadAsRepo {
    async loadBlob(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.blob) throw new Error(`Expected object with hash ${hash} to be blob but it was ${object.type}`);
      return object;
    }

    async loadText(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.blob) throw new Error(`Expected object with hash ${hash} to be blob but it was ${object.type}`);
      return {
        type: 'text' as 'text',
        body: blobToText(object.body)
      };
    }

    async loadTree(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.tree) throw new Error(`Expected object with hash ${hash} to be tree but it was ${object.type}`);
      return object;
    }

    async loadCommit(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.commit) throw new Error(`Expected object with hash ${hash} to be commit but it was ${object.type}`);
      return object;
    }

    async loadTag(hash : Hash) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== Type.tag) throw new Error(`Expected object with hash ${hash} to be tag but it was ${object.type}`);
      return object;
    }
  }
}