const PORT = process.env.PORT || 8080;

const Koa = require('koa');
const favicon = require('koa-favicon');
const static = require('koa-static');
const mount = require('koa-mount');
const app = new Koa();

app.use(favicon());
app.use(static('./pages'));
app.use(static('./js'));
app.listen(PORT);

console.log(`server started on localhost:${PORT}`);
