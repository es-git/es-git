import { IRawRepo, Types, Body, RawObject } from '@es-git/core';

export default class MemoryRepo implements IRawRepo {
  private readonly objects : Map<string, RawObject>
  private readonly refs : Map<string, string>
  constructor() {
    this.objects = new Map();
    this.refs = new Map();
  }

  async saveRaw(raw : RawObject) : Promise<void> {
    this.objects.set(raw.hash, raw);
  }

  async loadRaw(hash : string) : Promise<RawObject | undefined> {
    return await this.objects.get(hash);
  }

  async hasHash(hash : string) : Promise<boolean> {
    return await this.objects.has(hash);
  }

  async readRef(ref : string) : Promise<string | undefined> {
    return await this.refs.get(ref);
  }

  async updateRef(ref : string, hash : string) : Promise<void> {
    this.refs.set(ref, hash);
  }
}