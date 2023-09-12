const fs = require('fs');
/** 读取json文件 */
const readDataFile = (path) => {
  const res = fs.readFileSync(path, 'utf-8');
  return res;
};

/** 写入json文件 */

const writeDataFile = (path, data) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('写入JSON文件失败', error);
    return false;
  }
};
module.exports = {
  readDataFile,
  writeDataFile,
};
