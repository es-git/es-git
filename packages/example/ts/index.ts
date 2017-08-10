import * as path from 'path';
import { mix, Mode, Type } from '@es-git/core';
import NodeFsRepo from '@es-git/node-fs-repo';
import zlib from '@es-git/zlib-mixin';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import checkout from '@es-git/checkout-mixin';
import commit from '@es-git/commit-mixin';
import pathToObject from '@es-git/path-to-object-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import fetch from 'node-fetch';

class Repo extends mix(NodeFsRepo)
                  .with(zlib)
                  .with(object)
                  .with(pathToObject)
                  .with(walkers)
                  .with(checkout)
                  .with(commit)
                  .with(fetchMixin) {
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
    const commit = await this.loadObject(newHash);
    if(!commit || commit.type != Type.commit) throw new Error("shouldn't happen");
    await this.loadObjectByPath(commit.body.tree, ['src', 'index.js']);
  }
}


const repo = new Repo(fetch, path.join(__dirname, 'test-git/.git'));
repo.fetch('https://github.com/es-git/test-pull.git', 'origin').then(_ => console.log('success'));