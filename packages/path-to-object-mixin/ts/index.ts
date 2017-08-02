import { Type, Mode, Constructor, IRawRepo, Hash } from '@es-git/core';
import { IObjectRepo, TreeObject, BlobObject, ModeHash } from '@es-git/object-mixin';

export interface IPathToObjectRepo {
  loadObjectByPath(rootTree : Hash, path : string | string[]) : Promise<TreeObject | BlobObject | undefined>
}

export default function mixin<T extends Constructor<IObjectRepo>>(repo : T) : Constructor<IPathToObjectRepo> & T {
  return class PathToObjectRepo extends repo implements IObjectRepo {
    async loadObjectByPath(rootTree : Hash, path : string | string[]) : Promise<TreeObject | BlobObject | undefined> {
      let hash = rootTree;
      const parts = Array.isArray(path) ? path : path.split("/").filter(x => x.length > 0);
      for (const part of parts) {
        const object = await super.loadObject(hash);
        if (!object){
          throw new Error(`Missing object: ${hash}`);
        }else if(object.type === Type.blob){
          return undefined;
        }else if(object.type !== Type.tree){
          throw new Error(`Wrong object: ${hash}. Expected tree, got ${object.type}`);
        }else{
          const entry = object.body[part];
          if (!entry) return undefined;
          hash = entry.hash;
        }
      }
      const result = await super.loadObject(hash);
      if(!result) {
        throw new Error(`Missing object: ${hash}`);
      }
      if(result.type != Type.blob && result.type != Type.tree) {
          throw new Error(`Wrong object: ${hash}. Expected tree or blob, got ${result.type}`);
      }
      return result;
    }
  }
}