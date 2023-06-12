import { Translation } from './types';

export const parseJson = (source: string): Translation => {
  return JSON.parse(source, (key, value) => value === null || value === '' ? undefined : value);
};

export const toJsonString = (target: Translation): string => {
  return JSON.stringify(target, replacer, 2);
};

export const getJsonPaths = (obj: Translation, parentKey = '', result = new Map<string, string>()): Map<string, string> => {
  for (const key in obj) {
    const path = parentKey ? `${parentKey}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      getJsonPaths(value, path, result);
    } else {
      result.set(path, value);
    }
  }

  return result;
};

/**
 * Remove escaped sequences
 */
export function replacer(key: string, value: string | Translation) {
  return typeof value === 'string' ? value.replace(/\\/g, '') : value;
}
