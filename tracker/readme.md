### 一个前端埋点 SDK 包

## 使用方式

**安装**

```shell
npm install chovrio-tracker
pnpm add chovrio-tracker
cnpm install chovrio-tracker
```

**前端**

```javascript
// import Tracker from "./dist/index.esm.js";
import Tracker from "./dist/index.js";
const tracker = new Tracker({
  requestUrl: "http://localhost:3000/tracker/update", // 埋点上报地址
  historyTracker: true, // 监听普通路由变化
  hashTracker: true, // 监听hash路由变化
  domTracker: true, // 监听dom事件
  elementEvent: ["click"], // 监听dom事件的类型
  elementKey: ["eat"], // 监听发生事件标签的属性，存在数组中的属性上报属性内容，不存在不上报
  jsError: true, // 监听错误事件
});
```

**koa 后端接口基本实现**

```javascript
const koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const app = new koa();
const router = new Router();
// 上报接口只支持post请求
router.post("/tracker/update", (ctx) => {
  console.log(ctx.request);
  ctx.body = "上报成功";
});
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
```
