const PORT = process.env.PORT || 8080;
const KEY = process.env.KEY;

import 'babel-polyfill';
import Koa from 'koa';
import favicon from 'koa-favicon';
import serve from 'koa-static';
import mount from 'koa-mount';
import proxy from '@es-git/node-git-proxy';
const app = new Koa();

app.use(favicon());
app.use(serve('./pages'));
app.use(serve('./js'));
app.use(mount('/proxy', authenticate(ctx => proxy(ctx.req, ctx.res).catch(e => ctx.status = 500))));
app.listen(PORT);

function authenticate(handle){
  return ctx => {
    if(ctx.req.method === 'POST'
    && ctx.req.url === '/github.com/es-git/test-push.git/git-receive-pack'){
      ctx.req.headers['Authorization'] = `Basic ${KEY}`;
    }

    return handle(ctx);
  }

}

console.log(`server started on localhost:${PORT}`);
