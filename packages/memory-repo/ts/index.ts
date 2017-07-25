import { IRawRepo, Type, Hash } from '@es-git/core';

export default class MemoryRepo implements IRawRepo {
  private readonly objects : Map<string, Uint8Array>
  private readonly refs : Map<string, string>
  constructor() {
    this.objects = new Map();
    this.refs = new Map();
  }

  async saveRaw(hash : Hash, raw : Uint8Array) : Promise<void> {
    this.objects.set(hash, raw);
  }

  async loadRaw(hash : string) : Promise<Uint8Array | undefined> {
    return this.objects.get(hash);
  }

  async listRefs() : Promise<Hash[]> {
    return Array.from(this.refs.keys());
  }

  async getRef(ref : string) : Promise<string | undefined> {
    return this.refs.get(ref);
  }

  async setRef(ref : string, hash : string) : Promise<void> {
    this.refs.set(ref, hash);
  }

  async deleteRef(ref : string) : Promise<void> {
    this.refs.delete(ref);
  }
}