import modes from '../lib/modes';

export default repo => class extends repo {
  constructor(remote, ...args) {
    super(...args);
    this.remote = remote;
  }

  async loadAs(type, hash) {
    const body = await super.loadAs(type, hash);
    if (body === undefined) return await this.remote.loadAs(type, hash);
  }

  async readRef(ref) {
    const body = await super.readRef(ref);
    if (body === undefined) return await this.remote.readRef(ref);
  }
};
