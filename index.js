import Tracker from "./tracker/dist/index.mjs";
new Tracker({
  requestUrl: "http://localhost:4000/tracker/update",
  jsError: true,
  hashTracker: true,
  uuid: "chovrio",
}).sendTracker({
  haha: "hahah",
});
