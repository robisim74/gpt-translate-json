import { test, describe, expect, vi } from 'vitest';

import { readdir, readFile, writeFile } from 'fs/promises';
import { normalize } from 'path';
import OpenAI from 'openai';

import { gptTranslateJson } from '../src/index';
import { mockAddTranslationAsset, mockAddTranslationMetaTranslated, mockAddTranslationMetaTranslatedLangs, mockAddTranslationResponse, mockAddTranslationTranslatedAsset, mockMetaTranslated, mockMetaTranslatedLangs, mockTranslatedAsset } from './mock';

// Mock part of 'fs/promises' module
vi.mock('fs/promises', async () => {
  const mod = await vi.importActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...mod,
    readdir: vi.fn()
      .mockImplementationOnce(() => ['app.json'])
      .mockImplementationOnce(() => ['app.json']),
    readFile: vi.fn()
      .mockImplementationOnce(() => mockMetaTranslated)
      .mockImplementationOnce(() => mockMetaTranslatedLangs)
      .mockImplementationOnce(() => mockAddTranslationAsset)
      .mockImplementationOnce(() => mockTranslatedAsset),
    writeFile: vi.fn()
  };
});
// Mock part of 'fs' module
vi.mock('fs', async () => {
  const mod = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...mod,
    mkdirSync: vi.fn(() => { })
      .mockImplementationOnce(() => { }),
    existsSync: vi.fn(() => true)
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => true)
  };
});

describe('gptTranslateJson', () => {
  test('add translation', async () => {
    vi.spyOn(OpenAI.Chat.Completions.prototype, 'create').mockImplementationOnce(() => Promise.resolve<any>(mockAddTranslationResponse));

    await gptTranslateJson({
      apiKey: 'openai_api_key',
      model: 'gpt-3.5-turbo',
      maxTokens: 3000,
      langs: ['en-US', 'it-IT'],
      originalLang: 'en-US'
    });

    expect(readdir).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledTimes(4);

    expect(writeFile).toHaveBeenCalledTimes(3);
    expect(writeFile).toHaveBeenNthCalledWith(1, normalize('i18n/it-IT/app.json'), mockAddTranslationTranslatedAsset);
    expect(writeFile).toHaveBeenNthCalledWith(2, normalize('i18n/.metadata/translated.json'), mockAddTranslationMetaTranslated);
    expect(writeFile).toHaveBeenNthCalledWith(3, normalize('i18n/.metadata/translated-langs.json'), mockAddTranslationMetaTranslatedLangs);
  });
});
