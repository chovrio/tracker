const koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const path = require('path');
const KoaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const { readDataFile, writeDataFile } = require('./utils');
const app = new koa();
const router = new Router();

let src = path.join(__dirname, 'data.json');
const db = JSON.parse(readDataFile(src));

const option = (ctx, type) => {
  const body = ctx.request.body;
  for (const key in body) {
    if (Object.hasOwnProperty.call(body, key)) {
      const data = JSON.parse(key);
      const name = data.name;
      const referer = ctx.headers.referer;
      if (db.users[data.name]['web-site'][referer][type] === undefined) {
        db.users[data.name]['web-site'][referer][type] = [];
      }
      db.users[data.name]['web-site'][referer][type].unshift(data);
      writeDataFile(src, db);
    }
  }
};

// 用户鉴定接口
router.get('/user/:name', (ctx) => {
  const { name } = ctx.params;
  try {
    if (name && db.users[name]) {
      const referer = ctx.headers.referer;
      if (db.users.chovrio['web-site'][referer] === undefined) {
        db.users.chovrio['web-site'][referer] = {};
      }
      let pv = db.users.chovrio['web-site'][referer]?.pv || 0;
      db.users.chovrio['web-site'][referer].pv = ++pv;
      writeDataFile(src, db);
      ctx.body = 200;
    } else {
      ctx.body = 405;
    }
  } catch (error) {
    console.error('报错了', error);
  }
});

// 普通路由监听接口
router.post('/history', (ctx) => {
  option(ctx, 'history');
  ctx.body = '上报成功';
});

router.post('/dom', (ctx) => {
  option(ctx, 'dom');
  ctx.body = '上报成功';
});

router.post('/error', (ctx) => {
  option(ctx, 'error');
  ctx.body = '上报成功';
});
router.post('/data-only', (ctx) => {
  option(ctx, 'dataOnly');
  ctx.body = '上报成功';
});
app
  .use(cors())
  .use(bodyParser())
  .use(KoaStatic(path.resolve(__dirname, './track-sdk')));
app.use(router.routes()).use(router.allowedMethods());
app.listen(4000, () => {
  console.log('server running at http://localhost:4000');
});
