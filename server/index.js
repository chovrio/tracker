const koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const path = require("path");
const app = new koa();
const bodyParser = require("koa-bodyparser");
const router = new Router();
router.post("/tracker/update", (ctx) => {
  console.log(ctx.request.body);
  const body = ctx.request.body;
  for (const key in body) {
    console.log(key);
    console.log(body[key]);
  }
  ctx.body = "上报成功";
});
app.use(cors()).use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
