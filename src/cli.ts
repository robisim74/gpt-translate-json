import type { GptTranslateJsonOptions } from './types';
import { gptTranslateJson } from './index';

/**
 * Parse a cli argument to { key: value }
 */
const parseArgument = (arg: string): { key: string, value: any } => {
  const property = arg.split('=');
  if (property.length === 2 && property[0].startsWith('--')) {
    const key = property[0].slice(2);
    const value = /,/.test(property[1]) ? property[1].split(',') : property[1];
    return { key, value };
  }
  return { key: 'error', value: `- wrong option: "${property[0]}"` };
}

const assertType = (value: any, type: string): boolean => {
  if (type === value) return true;
  if (type === 'array' && Array.isArray(value)) return true;
  if (type === 'string' && typeof (value) === 'string') return true;
  if (type === 'number' && typeof (value) === 'number') return true;
  return false;
};

const wrongOption = (key: string, value: any): string => `- option "${key}": wrong value ${JSON.stringify(value)}`;
const missingOption = (name: string): string => `- missing option: "${name}"`;

const args = process.argv.slice(2);

const options: Partial<GptTranslateJsonOptions> = {};

const errors: string[] = [];

// Parse arguments
for (const arg of args) {
  const { key, value } = parseArgument(arg);
  switch (key) {
    case 'apiKey':
      if (assertType(value, 'string')) options.apiKey = value;
      else errors.push(wrongOption(key, value));
      break;
    case 'model':
      if (assertType(value, 'string')) options.model = value;
      else errors.push(wrongOption(key, value));
      break;
    case 'maxTokens':
      if (assertType(+value, 'number')) options.maxTokens = +value;
      else errors.push(wrongOption(key, value));
      break;
    case 'rules':
      if (assertType(value, 'array')) options.rules = value;
      else if (assertType(value, 'string')) options.rules = [value];
      else errors.push(wrongOption(key, value));
      break;
    case 'basePath':
      if (assertType(value, 'string')) options.basePath = value;
      else errors.push(wrongOption(key, value));
      break;
    case 'assetsPath':
      if (assertType(value, 'string')) options.assetsPath = value;
      else errors.push(wrongOption(key, value));
      break;
    case 'langs':
      if (assertType(value, 'array')) options.langs = value;
      else if (assertType(value, 'string')) options.langs = [value];
      else errors.push(wrongOption(key, value));
      break;
    case 'originalLang':
      if (assertType(value, 'string')) options.originalLang = value;
      else errors.push(wrongOption(key, value));
      break;
    case 'error':
      errors.push(value);
      break;
    default:
      errors.push(`- unknown option: "${key}"`);
  }
}

// Required options
if (!options.apiKey) errors.push(missingOption('apiKey'));
if (!options.apiKey) errors.push(missingOption('model'));
if (!options.maxTokens) errors.push(missingOption('maxTokens'));
if (!options.langs) errors.push(missingOption('langs'));
if (!options.originalLang) errors.push(missingOption('originalLang'));

// Log errors
if (errors.length > 0) {
  console.log('\x1b[36m%s\x1b[0m', 'GPT Translate Json options errors:');
  for (const error of errors) {
    console.log('\x1b[33m%s\x1b[0m', error);
  }

  process.exitCode = 1; // Exit process
}

// Process
console.log('\x1b[36m%s\x1b[0m', 'GPT Translate Json');
console.log('\x1b[32m%s\x1b[0m', 'translating files...');

gptTranslateJson(options as GptTranslateJsonOptions);
