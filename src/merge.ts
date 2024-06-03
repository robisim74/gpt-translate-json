import type { Translation } from './types';

export function deepSet(target: Translation, keys: string[], val: string | Translation) {
  let i = 0;
  const len = keys.length;
  while (i < len) {
    const key = keys[i++];
    target[key] = target[key] && !val ?
      target[key] : (i === len) ?
        val : typeof target[key] === 'object' ?
          target[key] : {};
    target = target[key];
  }
}

export function deepMerge(target: Translation, source: Translation): any {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return typeof item === 'object' && !Array.isArray(item);
}
