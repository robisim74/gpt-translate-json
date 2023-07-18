import { test, describe, expect, vi } from 'vitest';

import { readdir, readFile, writeFile } from 'fs/promises';
import { normalize } from 'path';
import { OpenAIApi } from 'openai';

import { gptTranslateJson } from '../src/index';
import { mockAsset, mockMetaTranslated, mockMetaTranslatedLangs, mockResponse, mockTranslatedAsset } from './mock';

// Mock part of 'fs/promises' module
vi.mock('fs/promises', async () => {
  const mod = await vi.importActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...mod,
    readdir: vi.fn()
      .mockImplementationOnce(() => ['app.json']),
    readFile: vi.fn()
      .mockImplementationOnce(() => mockAsset),
    writeFile: vi.fn()
  };
});
// Mock part of 'fs' module
vi.mock('fs', async () => {
  const mod = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...mod,
    mkdirSync: vi.fn()
      .mockImplementationOnce(() => { }),
  };
});

describe('gptTranslateJson', () => {
  test('translate', async () => {
    vi.spyOn(OpenAIApi.prototype, 'createChatCompletion').mockImplementationOnce(() => Promise.resolve<any>({ data: mockResponse }));

    await gptTranslateJson({
      apiKey: 'openai_api_key',
      model: 'gpt-3.5-turbo',
      maxTokens: 3000,
      langs: ['en-US', 'it-IT'],
      originalLang: 'en-US'
    });

    expect(readdir).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledTimes(1);

    expect(writeFile).toHaveBeenCalledTimes(3);
    expect(writeFile).toHaveBeenNthCalledWith(1, normalize('i18n/it-IT/app.json'), mockTranslatedAsset);
    expect(writeFile).toHaveBeenNthCalledWith(2, normalize('i18n/.metadata/translated.json'), mockMetaTranslated);
    expect(writeFile).toHaveBeenNthCalledWith(3, normalize('i18n/.metadata/translated-langs.json'), mockMetaTranslatedLangs);
  });
});
