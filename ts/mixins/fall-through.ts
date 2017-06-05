import modes from '../lib/modes';

import {
  IRepo,
  Type,
  Body
} from '../types'

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly remote : IRepo
    constructor(remote : IRepo, ...args : any[]) {
      super(...args);
      this.remote = remote;
    }

    async loadAs(type : Type, hash : string) {
      const body = await super.loadAs(type, hash);
      if (body === undefined) return await this.remote.loadAs(type, hash);
    }

    async readRef(ref : string) {
      const body = await super.readRef(ref);
      if (body === undefined) return await this.remote.readRef(ref);
    }
  }
}