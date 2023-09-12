## 一个埋点 SDK 包

### 前言

- 只做了简单的封装，目的是达到一个测试的效果，因为前段部门内有考虑过自己做一套埋点系统，目前只是前端的一个小 demo 。
- 服务端代码采用 koa ,没有接入数据库，采用 json 文件模拟数据库的读取和写入

### 功能

- 全局监听错误实现上报
- pv 记录
- 通过标签的`data-`属性，实现自定义事件上报
- 浏览器普通路由跳转记录上报
- 可以通过 `url的query` 进行指定功能的开启和关闭

### 使用

- 服务端

```bash
cd server
pnpm start
```

在 html 中引入

```html
<script>
  (function () {
    var hm = document.createElement('script');
    hm.src = 'http://localhost:4000/hm.js?name=chovrio&only=1';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(hm, s);
  })();
</script>
```
