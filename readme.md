---
title:手写埋点sdk包发布并在项目中使用 data:2023-2-11
---

## 安装

```
pnpm add chovrio-track
npm install chovrio-track
cnpm install chovrio-track
```

## 工具包的开发

### 项目基础结构搭建

**项目依赖：typescript + rollup**

```shell
	pnpm inin # 可用npm yarn
	pnpm add @types/node -D # node的一些类型 可以不装
	pnpm add rollup -D # 打包工具
	pnpm add typescript -D # 语言
	pnpm add rollup-plugin-dts -D
 	pnpm add rollup-plugin-typescript2 -D

	pnpm add typescript rollup @types/node rollup-plugin-dts rollup-plugin-typescript2 -D # 一步安装
```

安装好依赖后执行 ` npx tsc --init` 生成 tsconfig.json 文件

手动创建 rollup.config.js 文件，并配置

```js
import path from "path";
import ts from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import { fileURLToPath } from "node:url";
const __filenameNew = fileURLToPath(import.meta.url);
const __dirnameNew = path.dirname(__filenameNew);
export default [
  // 打包ts文件生成js
  {
    // 入口文件路径
    input: "./src/core/index.ts",
    // 打包生成文件存储位置
    output: [
      // 打包生成esmodule规范js文件
      {
        file: path.resolve(__dirnameNew, "./dist/index.esm.js"),
        // 生成文件的规范类型
        format: "es",
      },
      // 打包生成commanjs规范js文件
      {
        file: path.resolve(__dirnameNew, "./dist/index.cjs.js"),
        format: "cjs",
      },
      // 打包生成umd规范js文件
      {
        file: path.resolve(__dirnameNew, "./dist/index.js"),
        // 全局变量名
        name: "Tracker",
        format: "umd",
      },
      // 立即执行函数 这个没有什么必要
      {
        format: "iife",
        name: "Tracker",
        file: "./dist/index.iife.js",
      },
    ],
    plugins: [ts()],
  },
  // 打包ts文件生成.d.ts文件
  {
    input: "./src/core/index.ts",
    output: {
      file: path.resolve(__dirnameNew, "./dist/index.d.ts"),
    },
    plugins: [dts()],
  },
];
```

配置 package.json 文件的 scripts 脚本

```shell
	pnpm pkg set scripts.build="rollup -c"
```

此时我们执行 `pnpm build` 会发现有以下报错

![image-20230211111631761](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211111631761.png)

根据提示我们在 package.json 中 添加

```json
{
 ...
 "type":"module"
 ...
}
```

再次打包又会有报错

![image-20230211111919039](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211111919039.png)

所以我们将 tsconfig.json 中的 ` "module":"commanjs"`改为` "module":"ESNEXT"`

再次打包就不会有报错了(注意在入口文件 core/index.ts 随便写点内容，不然空文件是打包不了的)

![image-20230211112030189](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211112030189.png)

此时项目的基本结构如下，也算基本搭建好了架子，可以往里面填充内容了

![image-20230211112201720](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211112201720.png)

### SDK 包开发

首先我们在` types/index.ts`写入以下类型

```typescript
/**
 * @requestUrl 接口地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 携带Tracker-key 点击事件上报
 * @sdkVersionsdk版本
 * @extra透传字段
 * @jsError js 和 promise 报错异常上报
 */

export interface DefaultOptons {
  uuid: string | undefined;
  requestUrl: string | undefined;
  historyTracker: boolean;
  hashTracker: boolean;
  domTracker: boolean;
  sdkVersion: string | number;
  extra: Record<string, any> | undefined;
  jsError: boolean;
}

//必传参数 requestUrl
export interface Options extends Partial<DefaultOptons> {
  requestUrl: string;
}
```

在` core/index.ts`写入以下内容

```typescript
import type { DefaultOptons, Options } from "../types/index";
import pkg from "../../package.json";

export default class Tracker {
  public data: Options;
  constructor(options: Options) {
    // 按传入配置修改默认配置
    this.data = Object.assign(this.initDef(), options);
  }
  private initDef(): DefaultOptons {
    return <DefaultOptons>{
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      sdkVersion: pkg.version,
    };
  }
}
```

因为使用 ` import` 是无法导入 `.json` 文件的所以代码第二行会报错，我们需要在`tsconfig.json`中设置

```json
{
    ...
    "compilerOptions" : {
        "moduleResolution": "node", // 设置模块解析策略为node 也可以使用--moduleResolution来指定,但得用 tsc工具
        "resolveJsonModule": true, // 把json文件视作模块
    }
    ...
}
```

关于解析策略有一篇不错的文章 [tsconfig 之 moduleResolution 详解](https://blog.csdn.net/weixin_40013817/article/details/127200965)

也可以采用第二种解决办法，在根目录新建一个` type.d.ts`文件

```typescript
// type.d.ts

declare module "*.json" {
  const value: any;
  export default value;
}
```

这样我们也可以导入 json 文件，但是没有代码提示应该。

但是 rollup 如果要打包 json 文件我们必须要借助插件。

```shell
	pnpm add @rollup/plugin-json -D
```

并在 rollup.config.js 中配置，这里就不多做介绍了，直接引入配置即可

因为浏览器有两种路由方式：`hash路由`和`普通路由`，hash 路由就是带锚点的

我们先写普通路由的埋点

#### 普通路由监听

##### SDK 内容

首先，在 Tracker 类里面新增两个个私有方法 `installTracker` 及 `captureEvents` 并在构造器中调用 `installTracker` 此时`core/index.ts`代码如下

```typescript
import type { DefaultOptons, Options } from "../types/index";
import { version } from "../../package.json";

export default class Tracker {
  public data: Options;
  constructor(options: Options) {
    // 按传入配置修改默认配置
    this.data = Object.assign(this.initDef(), options);
    this.installTracker();
  }
  private initDef(): DefaultOptons {
    return <DefaultOptons>{
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      sdkVersion: version,
    };
  }
  private captureEvents<T>(EventList: string[], targetKey: string, data?: T) {
    EventList.forEach((event) => {
      console.log(event);
    });
  }
  private installTracker() {
    if (this.data.historyTracker) {
      this.captureEvents(
        ["pushState", "replaceState", "popstate"],
        "history-pv",
        {
          code: 10001,
          message: "用户浏览记录 ",
        }
      );
    }
  }
}
```

在这里我们监听了 `"pushState", "replaceState", "popstate"`三个事件(只要 Tracker 实例一旦创建)，就不做测试了，监听到了事件就得上报(可以做历史浏览记录)。所以我们 Tracker 类中新增一个上报函数 `reportTracker`

```typescript
// core/index.ts
  private reportTracker<T>(data: T) {
    const params = Object.assign(this.data, data, { time: new Date() });
    let headers = {
      type: "application/x-www-form-urlencoded",
    };
    let blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon(this.data.requestUrl, blob);
  }
```

该函数使用了 Blob 以及 navigator.sendBeacon，简单说一下它们的作用，blob 可以将数据转换成二进制流，转换后的数据与之前数据的对比图，这样在发送网络请求的时候就可以减少数据大小，提高请求速度(文件的分片上传也可以使用 Blob)。navigator.sendBeacon 也是为了上报提速的，同时可以保证会把数据发出去，不拖延卸载流程。这里有两篇文章，感兴趣的可以去看一看，[JS 中的 Navigator.sendBeacon() 是干什么的？](https://zhuanlan.zhihu.com/p/435549202)、[Javascript 中 Blob 介绍](https://blog.csdn.net/yaojiqic/article/details/125090825)

![image-20230211121433794](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211121433794.png)

写到这里，我们就不得不写一些服务端代码来进行测试了，因为这里只是测试，所以我们一切从简

##### 服务端代码

我们在 tracker 文件夹同级新建一个 server 文件夹

```shell
	cd ..
	mkdir server
	cd server
	pnpm init
	pnpm add nodemon -D
	pnpm add koa @koa/cors koa-router
	pnpm pkg set scripts.start="nodemon index.js"
```

`server/index.js`代码如下

```javascript
const koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const app = new koa();
const router = new Router();
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

写好服务端代码后直接`pnpm start`运行，然后新建测试文件夹

```shell
	cd ..
	mkdir test
```

创建`index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <button>路由跳转</button>
    <script src="./index.js" type="module"></script>
    <script>
      const btn = document.querySelector("button");
      btn.onclick = () => {
        history.pushState({ name: "chovrio" }, "test", "/tracker");
      };
    </script>
  </body>
</html>
```

创建`index.js`

```js
import Tracker from "../tracker/dist/index.js";
new Tracker({
  historyTracker: true,
});
```

我们开始测试，发现当我们点击按钮进行路由跳转的时候，update 请求并没有发出，当我们进行浏览器路由前进后退的时候，请求发出了，但是它们的事件类型都是 popstate，replaceState 和 pushState 事件都没有执行。为什么呢？因为 window 上没有这两个事件，所以我们得自定义事件。

![image-20230211153929585](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211153929585.png)

##### 自定义事件

在`utils/createEvent.ts`中写入以下代码

```typescript
export const createHistoryEvent = <T extends keyof History>(type: T) => {
  // 首先获得原函数
  const origin = history[type];
  // 返回一个函数
  return function (this: any) {
    // 新函数的this为原函数
    const res = origin.apply(this, arguments);
    // 新建一个事件为传入参数
    const e = new Event(type);
    // 通过window派发这个事件(只有派发后才能监听到)
    window.dispatchEvent(e);
    // 返回新函数
    return res;
  };
};
```

然后我们在`core/index.ts`的`Tracker`类中初始化默认配置的时候，就创建派发新的路由事件，改写后`initDef`如下

```typescript
  private initDef(): DefaultOptons {
    window.history["pushState"] = createHistoryEvent("pushState");
    window.history["replaceState"] = createHistoryEvent("replaceState");
    return <DefaultOptons>{
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      sdkVersion: version,
    };
  }
```

然后我们重新进行打包，再次测试就有效果了

![image-20230211155814402](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211155814402.png)

普通路由埋点暂时 over

#### hash 路由监听

**hash 路由埋点实现就非常简单了**，因为`window`本身就拥有`hashChange`事件，并且因为只是锚点后内容的改变，浏览器并不会刷新,我们在`installTracker`函数中新增判断。重新打包

```typescript
  private installTracker() {
	// 前面内容就不重复复制了
    if (this.data.hashTracker) {
      this.captureEvents(["hashchange"], "hash-pv", {
        code: 10001,
        type: "hash-history",
        message: "用户浏览记录 ",
      });
    }
  }
```

测试通过。记得`new Tracker实例的时候把 hashTracker 设置为true`

![image-20230211160827461](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211160827461.png)

#### dom 事件监听

##### 改写类型

首先，我们要明确什么样的元素发生什么事件才产生埋点，所以我们修改`types/index.ts`下的 `DefaultOptions`

```typescript
export interface DefaultOptons {
  uuid: string | undefined;
  requestUrl: string | undefined;
  historyTracker: boolean;
  hashTracker: boolean;
  domTracker: boolean;
  sdkVersion: string | number;
  extra: Record<string, any> | undefined;
  jsError: boolean;
  elementEvent?: Array<keyof WindowEventMap>;
  elementKey?: Array<string>;
}
```

然后我们在`installTracker`中新增判断

```typescript
if (this.data.domTracker) {
  this.targetKeyReport();
}
```

##### 新增方法

然后新增事件监听，这里的时间复杂度是 O(n^2)，有些复杂，但是一般监听事件和监听类型不多

```typescript
  private targetKeyReport() {
    this.data.elementEvent?.forEach((event) => {
      window.addEventListener(event, (e) => {
        const target = e.target as HTMLElement;
        this.data.elementKey?.forEach((key) => {
          const targetKey = target.getAttribute(key);
          if (targetKey)
            this.reportTracker({
              event,
              targetKey,
              data: {
                code: 10003,
                type: "dom",
                message: "用户操作记录 ",
              },
            });
        });
      });
    });
  }
```

重新打包一下再次测试 这里我们相当于监听了 click 事件，和发生事件元素身上是否存在 eat 属性

```js
// index.js
import Tracker from "./dist/index.js";
const tracker = new Tracker({
  requestUrl: "http://localhost:3000/tracker/update",
  historyTracker: true,
  hashTracker: true,
  domTracker: true,
  elementEvent: ["click"],
  elementKey: ["eat"],
});
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <button eat="吃饭">路由跳转</button>
    <script src="./index.js" type="module"></script>
    <script>
      const btn = document.querySelector("button");
      btn.onclick = () => {
        console.log(111);
      };
    </script>
  </body>
</html>
```

![image-20230211170511341](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211170511341.png)

#### 全局错误监听(重要)

首先我们要知道，浏览器环境下会出现的错误类型，简单来说就两种。异步错误和同步错误。异步错误大部分都产生自网络请求，而同步错误则是发生在代码执行过程中。捕获错误是一件非常重要的事情(你也不想网站突然崩掉吧)。当我们这里只是做的错误上报。

##### 了解如何监听错误

我们改写`index.html`文件内容如下，点击按钮即可产生错误并监听到。只要是在`promise`中捕获到的错误事件都是`unhandledrejection`，在这里使用 fetch 只是为了方便

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <button eat="吃饭">路由跳转</button>
    <script src="./index.js" type="module"></script>
    <script>
      const btn = document.querySelector("button");
      btn.onclick = () => {
        fetch("http://111111");
        throw new Error("错误发生了");
      };
      window.addEventListener("unhandledrejection", (e) => {
        console.log("我是reject", e);
      });
      window.addEventListener("error", (e) => {
        console.log("我是error", e);
      });
    </script>
  </body>
</html>
```

##### 监听错误

我们在`installTracker`函数中新增判断`jsError`是否开启

```typescript
if (this.data.jsError) {
  this.jsError();
}
```

再在 Tracker 中新增几个函数

```typescript
  private errorEvent() {
    window.addEventListener("error", (event) => {
      this.reportTracker({
        event: "error",
        targetKey: "同步错误",
        data: {
          code: 10004,
          message: event.message,
        },
      });
    });
  }
  private promiseReject() {
    window.addEventListener("unhandledrejection", (event) => {
      event.promise.catch((error) => {
        this.reportTracker({
          event: "promise",
          targetKey: "异步错误",
          error: {
            code: 10005,
            message: error,
          },
        });
      });
    });
  }
  private jsError() {
    this.errorEvent();
    this.promiseReject();
  }
```

再次进行打包进行测试(注意在`index.js`中设置`jsError:true`)

![image-20230211224728217](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211224728217.png)

## 服务端代码的实现

服务端只需要写好基本代码就能跑了，至于获得数据后怎么处理就全凭喜好了，基本代码如下

```js
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
```

数据内容展示

![image-20230211231633625](https://aesthetic-stroopwafel-621be5.netlify.app/tracker/image-20230211231633625.png)
