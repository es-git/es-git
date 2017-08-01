import { mix, Mode } from '@es-git/core';
import NodeFsRepo from '@es-git/node-fs-repo';
import zlib from '@es-git/zlib-mixin';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import checkout from '@es-git/checkout-mixin';
import commit from '@es-git/commit-mixin';

class Repo extends mix(NodeFsRepo).with(zlib).with(object).with(walkers).with(checkout).with(commit) {
  async test() {
    const refs = await this.listRefs();
    console.log(refs);
    const hash = await this.getRef(refs[0]);
    console.log(hash);
    if(!hash) return;
    const commit = await this.loadObject(hash);
    console.log(commit);
    if(!commit || commit.type != 'commit') return;
    const tree = await this.loadObject(commit.body.tree);
    console.log(tree);
    const dir = await this.checkout('refs/heads/master');
    console.log(dir);
    console.log(dir.folders['src'].files['index.js'].text);
    /*const newHash = await this.commit(
      'refs/heads/master',
      {
        files: dir.files,
        folders: {
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
      commit.body.author);
    console.log(newHash);*/
  }
}


const repo = new Repo('/home/marius/programming/git-test/.git');
repo.test();