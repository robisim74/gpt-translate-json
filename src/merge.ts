import type { Translation } from './types';

export function deepSet(target: Translation, keys: string[], val: string | Translation) {
  let i = 0;
  const len = keys.length;
  while (i < len) {
    const key = keys[i++];
    target[key] = (i === len) ? val : typeof target[key] === 'object' ? target[key] : {};
    target = target[key];
  }
}

export function merge(target: Translation, source: Translation) {
  target = { ...target, ...source };
  return target;
}
