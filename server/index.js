const koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const path = require("path");
const app = new koa();
const bodyParser = require("koa-bodyparser");
const router = new Router();
router.post("/tracker/update", (ctx) => {
  const body = ctx.request.body;
  for (const key in body) {
    if (Object.hasOwnProperty.call(body, key)) {
      console.log(JSON.parse(key));
    }
  }
  ctx.body = "上报成功";
});
app.use(cors()).use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());
app.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
