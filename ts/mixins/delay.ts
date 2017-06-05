"use strict";

import {
  IRepo,
  Type,
  Body
} from '../types';

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {
    private readonly ms : number
    constructor (ms : number, ...args : any[]) {
      super(...args);
      this.ms = ms;
    }

    async saveAs(type : Type, value : Body) {
      await delay(this.ms);
      return await super.saveAs(type, value);
    }

    async loadAs(type : Type, hash : string) {
      await delay(this.ms);
      return await super.loadAs(type, hash);
    }

    async readRef(ref : string) {
      await delay(this.ms);
      return await super.readRef(ref);
    }

    async updateRef(ref : string, hash : string) {
      await delay(this.ms);
      return await super.updateRef(ref, hash);
    }

    /*async createTree(entries) {
      await delay(this.ms);
      return await super.createTree(entries);
    }*/
  }
}

function delay(ms : number){
  return new Promise(res => setTimeout(res, ms));
}