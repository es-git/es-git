const PORT = process.env.PORT || 8080;

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
app.use(mount('/proxy', ctx => proxy(ctx.req, ctx.res)));
app.listen(PORT);

console.log(`server started on localhost:${PORT}`);
