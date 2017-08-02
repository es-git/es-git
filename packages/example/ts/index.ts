import * as path from 'path';
import { mix, Mode, Type } from '@es-git/core';
import NodeFsRepo from '@es-git/node-fs-repo';
import zlib from '@es-git/zlib-mixin';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import checkout from '@es-git/checkout-mixin';
import commit from '@es-git/commit-mixin';

class Repo extends mix(NodeFsRepo).with(zlib).with(object).with(walkers).with(checkout).with(commit) {
  async init() {
    await super.init();
    const treeHash = await this.saveTree({});
    const commitHash = await this.saveObject({
      type: Type.commit,
      body: {
        author: {
          name: 'Marius Gundersen',
          email: 'me@mariusgundersen.net',
          date: new Date()
        },
        committer: {
          name: 'Marius Gundersen',
          email: 'me@mariusgundersen.net',
          date: new Date()
        },
        message: 'initial commit',
        tree: treeHash,
        parents: []
      }
    })
    await this.setRef('refs/heads/master', commitHash);
  }
  async test() {
    const dir = await this.checkout('refs/heads/master');
    console.log(dir);
    const newHash = await this.commit(
      'refs/heads/master',
      {
        files: dir.files,
        folders: {
          ...dir.folders,
          'src': {
            files: {
              'index.js': {
                mode: Mode.file,
                text: 'console.log(hello)'
              }
            }
          }
        },
      },
      'second test commit',
      {
        name: 'Marius Gundersen',
        email: 'me@mariusgundersen.net',
        date: new Date()
      });
    console.log(newHash);
  }
}


const repo = new Repo(path.join(__dirname, 'test-git/.git'));
repo.init().then(() => repo.test());