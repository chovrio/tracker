import type { DefaultOptons, Options, ElementMap } from '../types/index';
import { createHistoryEvent, getTime, query } from '../utils';
import 'tslib';
class Tracker {
  public data: Options;
  constructor(options: Options) {
    // 按传入配置修改默认配置
    this.data = Object.assign(this.initDef(), options);
    this.installTracker();
  }
  private initDef(): DefaultOptons {
    window.history['pushState'] = createHistoryEvent('pushState');
    window.history['replaceState'] = createHistoryEvent('replaceState');
    return <DefaultOptons>{
      historyTracker: false,
      hashTracker: false,
      domTracker: false,
      jsError: false,
      dataOnly: false,
    };
  }
  private targetKeyReport() {
    if (this.data.element) {
      for (const [keyTarget, event] of this.data.element) {
        window.addEventListener(event, (e) => {
          const target = e.target as HTMLElement;
          const targetKey = target.getAttribute(keyTarget);
          if (targetKey) {
            this.reportTracker('dom', {
              event,
              targetKey,
              data: {
                code: 10003,
                type: 'dom',
                message: '用户操作记录 ',
                keyTarget,
                targetKey,
              },
            });
          }
        });
      }
    }
  }
  private captureEvents<T>(EventList: string[], targetKey: string, data?: T) {
    EventList.forEach((event) => {
      window.addEventListener(event, () => {
        this.reportTracker(targetKey, {
          event,
          targetKey,
          data,
          href: location.href,
        });
      });
    });
  }
  private captureOblyEvents<T>(
    EventList: string[],
    targetKey: string,
    data?: T
  ) {
    EventList.forEach((event) => {
      document.addEventListener(event, (e: any) => {
        e.target;
        if (
          e &&
          e.target &&
          e.target.getAttribute &&
          e.target.getAttribute('data-chovrio') !== null
        ) {
          console.log(e.target.getAttribute('data-chovrio'));
          const json = JSON.parse(
            e.target.getAttribute('data-chovrio').replace(/'/g, `"`)
          );
          this.reportTracker(targetKey, {
            event,
            targetKey,
            message: data,
            data: json,
          });
        }
      });
    });
  }
  private installTracker() {
    if (this.data.historyTracker) {
      this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history', {
        code: 10001,
        type: 'history',
        message: '用户浏览记录 ',
      });
    }
    if (this.data.hashTracker) {
      this.captureEvents(['hashchange'], 'hash', {
        code: 10002,
        type: 'hash-history',
        message: '用户浏览记录 ',
      });
    }
    if (this.data.domTracker) {
      this.targetKeyReport();
    }
    if (this.data.jsError) {
      this.jsError();
    }
    if (this.data.dataOnly) {
      this.captureOblyEvents(['click'], 'data-only', {
        code: 10005,
        type: 'data-only',
        message: '自定义事件 ',
      });
    }
  }
  private errorEvent() {
    window.addEventListener('error', (event) => {
      this.reportTracker('error', {
        event: 'error',
        targetKey: '同步错误',
        data: {
          code: 10004,
          message: event.message,
        },
      });
    });
  }
  private promiseReject() {
    window.addEventListener('unhandledrejection', (event) => {
      event.promise.catch((error) => {
        this.reportTracker('error', {
          event: 'promise',
          targetKey: '异步错误',
          error: {
            code: 10005,
            message: error.toString(),
          },
        });
      });
    });
  }
  private jsError() {
    this.errorEvent();
    this.promiseReject();
  }
  /** 只管上报的请求 */
  private reportTracker<T>(url: string, data: T) {
    const name = this.data.uuid;
    const time = getTime(new Date().getTime(), true);
    const params = Object.assign(
      {
        name,
        time,
      },
      data
    );
    let headers = {
      type: 'application/x-www-form-urlencoded',
    };
    let blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon(this.data.requestUrl + url, blob);
  }
  /** 需要返回的请求 */
  private async fetch<T>(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: T
  ) {
    const res = await fetch(`${this.data.requestUrl}${url}`, {
      method,
      body: data ? JSON.stringify(data) : null,
    });
    return await res.json();
  }
  public sendTracker<T>(url: string, data: T) {
    this.reportTracker(url, data);
  }
  public setUser<T extends DefaultOptons['uuid']>(uuid: T) {
    this.data.uuid = uuid;
  }
  public setExtra<T extends DefaultOptons['extra']>(extra: T) {
    this.data.extra = extra;
  }
}

(async () => {
  const scripts = document.querySelectorAll('script');
  const src = scripts[0].src;
  const isfind = (type: string) =>
    search[type] ? parseInt(search[type]) === 1 : false;
  let search = query(src);
  if (search.name === undefined) {
    console.warn('身份认证失败，无法进行埋点');
  } else {
    const res = await fetch(`http://localhost:4000/user/${search.name}`);
    const code = await res.text();
    if (code === '200') {
      new Tracker({
        uuid: search.name,
        requestUrl: 'http://localhost:4000/',
        historyTracker: true,
        jsError: isfind('jsError'),
        dataOnly: isfind('only'),
      });
    } else {
      console.warn('身份认证失败，无法进行埋点');
    }
  }
})();
