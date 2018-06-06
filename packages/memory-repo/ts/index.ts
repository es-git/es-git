import { IRawRepo, Hash } from '@es-git/core';

export default class MemoryRepo implements IRawRepo {
  private readonly objects: Map<string, Uint8Array>
  private readonly refs : Map<string, string>
  private readonly metadata: Map<string, Uint8Array>
  constructor() {
    this.objects = new Map();
    this.refs = new Map();
    this.metadata = new Map();
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

  async setRef(ref : string, hash : string | undefined) : Promise<void> {
    if(hash === undefined){
      this.refs.delete(ref);
    }else{
      this.refs.set(ref, hash);
    }
  }

  async hasObject(hash: string): Promise<boolean> {
    return this.objects.has(hash);
  }

  async saveMetadata(name: string, value: Uint8Array | undefined): Promise<void> {
    if(value){
      this.metadata.set(name, value);
    }else{
      this.metadata.delete(name);
    }
  }

  async loadMetadata(name: string): Promise<Uint8Array | undefined> {
    return this.metadata.get(name);
  }
}