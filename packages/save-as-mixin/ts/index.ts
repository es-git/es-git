import { Constructor, Hash, Type } from '@es-git/core';
import { IObjectRepo, TreeBody, CommitBody, TagBody, textToBlob } from '@es-git/object-mixin';

export interface ISaveAsRepo {
  saveBlob(blob : Uint8Array) : Promise<Hash>
  saveText(text : string) : Promise<Hash>
  saveTree(tree : TreeBody) : Promise<Hash>
  saveCommit(commit : CommitBody) : Promise<Hash>
  saveTag(tag : TagBody) : Promise<Hash>
}

export default function saveAsMixin<T extends Constructor<IObjectRepo>>(repo : T)
: T & Constructor<ISaveAsRepo> {
  return class SaveAsRepo extends repo implements ISaveAsRepo {
    async saveBlob(blob : Uint8Array) {
      return await super.saveObject({
        type: Type.blob,
        body: blob
      });
    }

    async saveText(text : string){
      return await super.saveObject({
        type: Type.blob,
        body: textToBlob(text)
      });
    }

    async saveTree(tree : TreeBody){
      return await super.saveObject({
        type: Type.tree,
        body: tree
      });
    }

    async saveCommit(commit : CommitBody){
      return await super.saveObject({
        type: Type.commit,
        body: commit
      });
    }

    async saveTag(tag : TagBody){
      return await super.saveObject({
        type: Type.tag,
        body: tag
      });
    }
  }
}