// import Tracker from "./dist/index.esm.js";
import Tracker from "./dist/index.js";
const tracker = new Tracker({
  requestUrl: "http://localhost:3000/tracker/update",
  historyTracker: true,
  hashTracker: true,
  domTracker: true,
  elementEvent: ["click"],
  elementKey: ["eat"],
  jsError: true,
});
// let headers = {
//   type: "application/x-www-form-urlencoded",
// };
// let blob = new Blob([JSON.stringify({ chovrio: "name" })], headers);
// console.log(blob);
