import { test, describe, expect, vi } from 'vitest';

import { readdir, readFile, writeFile } from 'fs/promises';
import { normalize } from 'path';
import OpenAI from 'openai';

import { gptTranslateJson } from '../src/index';
import { mockAddLangAsset, mockAddLangMetaTranslated, mockAddLangMetaTranslatedLangs, mockAddLangResponse, mockAddLangTranslatedAsset, mockAddTranslationMetaTranslated, mockAddTranslationMetaTranslatedLangs, mockAddTranslationTranslatedAsset } from './mock';

// Mock part of 'fs/promises' module
vi.mock('fs/promises', async () => {
  const mod = await vi.importActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...mod,
    readdir: vi.fn()
      .mockImplementationOnce(() => ['app.json'])
      .mockImplementationOnce(() => ['app.json']),
    readFile: vi.fn()
      .mockImplementationOnce(() => mockAddTranslationMetaTranslated)
      .mockImplementationOnce(() => mockAddTranslationMetaTranslatedLangs)
      .mockImplementationOnce(() => mockAddLangAsset)
      .mockImplementationOnce(() => mockAddTranslationTranslatedAsset),
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
      .mockImplementationOnce(() => false)
  };
});

describe('gptTranslateJson', () => {
  test('add lang', async () => {
    vi.spyOn(OpenAI.Chat.Completions.prototype, 'create').mockImplementationOnce(() => Promise.resolve<any>(mockAddLangResponse));

    await gptTranslateJson({
      apiKey: 'openai_api_key',
      model: 'gpt-3.5-turbo',
      maxTokens: 3000,
      langs: ['en-US', 'it-IT', 'es-ES'],
      originalLang: 'en-US'
    });

    expect(readdir).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledTimes(4);

    expect(writeFile).toHaveBeenCalledTimes(4);
    expect(writeFile).toHaveBeenNthCalledWith(1, normalize('i18n/it-IT/app.json'), mockAddTranslationTranslatedAsset);
    expect(writeFile).toHaveBeenNthCalledWith(2, normalize('i18n/es-ES/app.json'), mockAddLangTranslatedAsset);
    expect(writeFile).toHaveBeenNthCalledWith(3, normalize('i18n/.metadata/translated.json'), mockAddLangMetaTranslated);
    expect(writeFile).toHaveBeenNthCalledWith(4, normalize('i18n/.metadata/translated-langs.json'), mockAddLangMetaTranslatedLangs);
  });
});
