import type { DefaultOptons, Options } from "../types/index";
import { version } from "../../package.json";
import { createHistoryEvent } from "../utils/createEvent";

class Tracker {
  public data: Options;
  constructor(options: Options) {
    // 按传入配置修改默认配置
    this.data = Object.assign(this.initDef(), options);
    this.installTracker();
  }
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
  private targetKeyReport() {
    if (this.data.element) {
      for (const [keyTarget, event] of this.data.element) {
        window.addEventListener(event, (e) => {
          const target = e.target as HTMLElement;
          const targetKey = target.getAttribute(keyTarget);
          if (targetKey) {
            this.reportTracker({
              event,
              targetKey,
              data: {
                code: 10003,
                type: "dom",
                message: "用户操作记录 ",
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
        this.reportTracker({
          event,
          targetKey,
          data,
        });
      });
    });
  }
  private installTracker() {
    if (this.data.historyTracker) {
      this.captureEvents(
        ["pushState", "replaceState", "popstate"],
        "history-pv",
        {
          code: 10001,
          type: "history",
          message: "用户浏览记录 ",
        }
      );
    }
    if (this.data.hashTracker) {
      this.captureEvents(["hashchange"], "hash-pv", {
        code: 10002,
        type: "hash-history",
        message: "用户浏览记录 ",
      });
    }
    if (this.data.domTracker) {
      this.targetKeyReport();
    }
    if (this.data.jsError) {
      this.jsError();
    }
  }
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
  private reportTracker<T>(data: T) {
    const params = Object.assign(this.data, data, { time: new Date() });
    let headers = {
      type: "application/x-www-form-urlencoded",
    };
    let blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon(this.data.requestUrl, blob);
  }
}
export default Tracker;
