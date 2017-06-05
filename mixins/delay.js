"use strict";

export default repo => class extends repo {
  constructor (ms, ...args) {
    super(...args);
    this.ms = ms;
  }

  async saveAs(type, value) {
    await delay(this.ms);
    return await super.saveAs(type, value);
  }

  async loadAs(type, hash) {
    await delay(this.ms);
    return await super.loadAs(type, hash);
  }

  async readRef(ref) {
    await delay(this.ms);
    return await super.readRef(ref);
  }

  async updateRef(ref, hash) {
    await delay(this.ms);
    return await super.updateRef(ref, hash);
  }

  async createTree(entries) {
    await delay(this.ms);
    return await super.createTree(entries);
  }
}

function delay(ms){
  return new Promise(res => setTimeout(res, ms));
}