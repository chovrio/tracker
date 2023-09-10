export const isString = (e: any) => typeof e === 'string';
export const query = (src: string) => {
  return src
    .split('?')[1]
    .split('&')
    .reduce((pre: Record<string, string>, cur) => {
      const temp = cur.split('=');
      pre[temp[0]] = temp[1];
      return pre;
    }, {});
};
