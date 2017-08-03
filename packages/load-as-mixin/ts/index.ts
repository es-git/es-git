import { Constructor, Hash, Type } from '@es-git/core';
import { IObjectRepo, GitObject } from '@es-git/object-mixin';

export interface ILoadAsRepo {
  loadAs(hash : Hash, type : Type) : Promise<GitObject>
}

export default function loadAsMixin<T extends Constructor<IObjectRepo>>(repo : T)
: Constructor<IObjectRepo> & Constructor<ILoadAsRepo> {
  return class LoadAsRepo extends repo implements ILoadAsRepo {

    async loadAs(hash : Hash, type : Type) {
      const object = await super.loadObject(hash);
      if(!object) throw new Error(`Object for hash ${hash} does not exist`);
      if(object.type !== type) throw new Error(`Expected object with hash ${hash} to be ${type} but it was ${object.type}`);
      return object
    }
  }
}