# node-git-proxy

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/node-git-proxy
```

## Usage

This package can be used as an http proxy for git clients that run in the browser. It is useful because none of the major git hosts support CORS, so you cannot use XHR (or fetch) to clone a git repo in the browser. This package solves this problem by acting as a proxy so you can use the [fetch-mixin](https://www.npmjs.com/package/@es-git/fetch-mixin) and the [push-mixin](https://www.npmjs.com/package/@es-git/push-mixin) in the browser.

```ts
//server.js
import * as http from 'http';
import proxy from 'node-git-proxy';

const server = new http.Server(proxy);

// or with koa:
app.use(ctx => proxy(ctx.req, ctx.res));

server.listen(80);

//////////////////////////////////////
//index.js
import mix from '@es-git/mix';
import Memory from '@es-git/__template__';
import objectMixin from '@es-git/object-mixin';
import walkersMixin from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import pushMixin from '@es-git/push-mixin';

async function run(){
  const Repo = mix(Memory)
    .with(objectMixin)
    .with(walkersMixin)
    .with(fetchMixin, fetch)
    .with(pushMixin, fetchIt);

  const repo = new Repo();

  await repo.fetch('http://localhost/github.com/es-git/test-pull.git');

  //TODO: play around with the repo

  await repo.push('http://localhost/github.com/es-git/test-pull.git', 'refs/heads/master');
}

run();
```

