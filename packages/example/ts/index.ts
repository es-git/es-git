import * as path from 'path';
import { mix, Mode, Type, decode } from '@es-git/core';
import NodeFsRepo from '@es-git/node-fs-repo';
import zlib from '@es-git/zlib-mixin';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import checkout from '@es-git/checkout-mixin';
import commit from '@es-git/commit-mixin';
import pathToObject from '@es-git/path-to-object-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import pushMixin, { Fetch } from '@es-git/push-mixin';
import nodeFetch, { Request, RequestInit, Response } from 'node-fetch';

if (typeof btoa === 'undefined') {
  (global as any).btoa = function (str : string) {
    return new Buffer(str).toString('base64');
  };
}

if (typeof atob === 'undefined') {
  (global as any).atob = function (b64Encoded : string) {
    return new Buffer(b64Encoded, 'base64').toString();
  };
}

class Repo extends mix(NodeFsRepo)
                  .with(zlib)
                  .with(object)
                  .with(pathToObject)
                  .with(walkers)
                  .with(checkout)
                  .with(commit)
                  .with(fetchMixin)
                  .with(pushMixin) {
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
    const result = await this.loadObjectByPath(commit.body.tree, ['src', 'index.js']);
    if(result && result.type === Type.blob){
      console.log(decode(result.body));
    }
  }
}

const fetch = fetchify(nodeFetch);

(async function(){
  const repo = new Repo(fetch, fetch, path.join(__dirname, 'test-git/.git'));
  await repo.test();
  console.log(await repo.getRef('refs/heads/master'));
  const result = await repo.push('http://localhost:8000/es-git/test-pull.git', 'refs/heads/master', {
    username: process.argv[2],
    password: process.argv[3]
  });

  console.log(result);
})().then(_ => console.log('success!'), e => console.error(e));

function fetchify(fetch : (url: string | Request, init?: RequestInit) => Promise<Response>){
  return async (url: string | Request, init?: RequestInit) => {
    if(init && init.body){
      init.body = Buffer.from(init.body as any)
      console.log(init.body);
    }
    const response = await fetch(url, init);
    return {
      arrayBuffer: async () => {
        const buf = await response.buffer();
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      },
      text: () => response.text(),
      status: response.status,
      statusText: response.statusText
    };
  };
}