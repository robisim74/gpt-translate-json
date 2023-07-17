import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { normalize } from 'path';
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai';

import { GptTranslateJsonOptions, Translation } from './types';
import { deepSet } from './merge';
import { getJsonPaths, parseJson, toJsonString } from './json-functions';

/**
 * Translate Json files using OpenAI GPT Chat Completions API
 */
export async function gptTranslateJson(options: GptTranslateJsonOptions) {
  // Resolve options
  const resolvedOptions: Required<GptTranslateJsonOptions> = {
    ...options,
    basePath: options.basePath ?? './',
    rules: options.rules ?? [
      'do not translate proper names',
      'do not translate texts enclosed in double braces {{}}',
      'do not translate html tags',
      'do not translate URLs'
    ],
    assetsPath: options.assetsPath ?? 'i18n'
  }

  // Assets data
  // lang => filename => translation
  const assetsMap = new Map<string, Map<string, Translation>>();
  // Translated data
  // lang => filename => path => value
  const translatedMap = new Map<string, Map<string, Map<string, string>>>();
  // Translated paths
  let metaPaths = new Set<string>();
  // Translated langs
  let metaLangs = new Set<string>();

  // OpenAI configuration
  const configuration = new Configuration({
    apiKey: resolvedOptions.apiKey,
  });

  const openai = new OpenAIApi(configuration);

  // Count total used tokens
  let usedTokens = 0;

  const readMeta = async () => {
    const baseMeta = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/.metadata`);
    if (existsSync(baseMeta)) {
      const pathsSource = await readFile(`${baseMeta}/translated.json`, 'utf8');
      if (pathsSource) {
        const parsed: string[] = JSON.parse(pathsSource);
        metaPaths = new Set(parsed);
      }
      const langsSource = await readFile(`${baseMeta}/translated-langs.json`, 'utf8');
      if (langsSource) {
        const parsed: string[] = JSON.parse(langsSource);
        metaLangs = new Set(parsed);
      }
    }
  };

  const readAssets = async () => {
    for (const lang of resolvedOptions.langs) {
      const baseAssets = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/${lang}`);

      if (existsSync(baseAssets)) {
        const files = await readdir(baseAssets);

        if (files.length > 0) {
          let filesMap = new Map<string, Translation>();

          for (const filename of files) {
            let data: Translation = {};

            const source = await readFile(`${baseAssets}/${filename}`, 'utf8');
            if (source) {
              data = parseJson(source);
            }
            filesMap.set(filename, data);
          }
          assetsMap.set(lang, filesMap);
        }
      }
    }
  };

  const generatePrompt = (displayName: string, rules: string[], strData: string): string => {
    const originalDisplayName = new Intl.DisplayNames(['en'], { type: 'language' }).of(resolvedOptions.originalLang);
    // Request
    let prompt = `Translate the following array of texts from ${originalDisplayName} to ${displayName}: `;
    // Data
    prompt += strData;
    // Rules
    prompt += ' Rules: ';
    prompt += rules.join(';');
    prompt += '. ';
    // Return type
    prompt += 'You have to return only the translated array in the same order, and nothing else.';

    return prompt;
  };

  const generateMessages = (prompt: string) => {
    const messages = [
      { role: ChatCompletionRequestMessageRoleEnum.User, content: prompt }
    ];
    return messages;
  };

  /**
   * Estimate total tokens in request (prompt + completion)
   * @param lenTexts Array of texts chars
   * @param chars 1 token ~ 4 chars in English
   * @param promptTokens Basic prompt tokens in each request: ~ 60 + other rules
   * @returns Expected tokens
   */
  const estimateTokens = (lenTexts: number, chars = 4, promptTokens = 100): number => {
    return (lenTexts / chars) * 2 + promptTokens;
  };

  /**
   * Split texts to respect API maxTokens
   */
  const splitTexts = (texts: string[]): string[][] => {
    const strTexts = JSON.stringify(texts);
    const lenTexts = strTexts.length;

    function* chunks(arr: string[], n: number): Generator<string[], void> {
      for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
      }
    }

    const estimatedTokens = estimateTokens(lenTexts);
    const n = Math.ceil(estimatedTokens / resolvedOptions.maxTokens);

    return [...chunks(texts, Math.ceil(lenTexts / n))];
  };

  const flattenData = (filesMap: Map<string, Translation>): Map<string, Map<string, string>> => {
    const flattenData = new Map<string, Map<string, string>>();
    for (const [filename, data] of filesMap) {
      flattenData.set(filename, getJsonPaths(data));
    }

    return flattenData;
  };

  const filterData = (flatFilesMap: Map<string, Map<string, string>>) => {
    const filteredData = new Map<string, Map<string, string>>();
    for (const [filename, data] of flatFilesMap) {
      const filteredFlatData = new Map<string, string>();
      for (const [key, value] of data) {
        if (!metaPaths.has(key)) {
          filteredFlatData.set(key, value);
        }
      }
      filteredData.set(filename, filteredFlatData);
    }

    return filteredData;
  };

  const translateByFile = async (
    filename: string,
    data: Map<string, string>,
    lang: string
  ): Promise<{ filename: string, translatedData: Map<string, string> }> => {
    const displayName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || lang;

    const translatedData = new Map<string, string>();
    try {
      const texts = Array.from(data.values());
      let splittedTexts = splitTexts(texts);
      splittedTexts = splittedTexts.filter(t => t.length > 0);

      let translatedTexts: string[] = [];
      for (const text of splittedTexts) {
        const prompt = generatePrompt(displayName, resolvedOptions.rules, JSON.stringify(text));
        const messages = generateMessages(prompt);

        // Call API
        try {
          const response = await openai.createChatCompletion({
            model: resolvedOptions.model,
            messages: messages,
            temperature: 0,
            n: 1
          });

          if (response?.data) {
            const content = response.data.choices?.[0].message?.content;
            if (content) {
              translatedTexts = [...translatedTexts, ...JSON.parse(content)]
            }

            // Count tokens
            usedTokens += response.data.usage?.total_tokens ?? 0;
          } else {
            throw new Error('OpenAI API - No response');
          }
        } catch (ex: any) {
          throw new Error('OpenAI API - ' + ex.response.statusText);
        }
      }

      const keys = Array.from(data.keys());

      // Check the match
      if (keys.length === translatedTexts.length) {
        // Set translation
        keys.forEach((key, i) => {
          translatedData.set(key, translatedTexts[i]);
        });

      } else {
        throw new Error('Translations mismatching');
      }
    } catch (ex: any) {
      throw new Error(`${filename}: ${ex.message}`);
    }

    return { filename: filename, translatedData: translatedData };
  };

  const translateByLang = async (lang: string, filesMap: Map<string, Map<string, string>>) => {
    const tasks: Promise<{ filename: string, translatedData: Map<string, string> }>[] = [];

    for (const [filename, data] of filesMap) {
      tasks.push(translateByFile(filename, data, lang));
    }

    const results = await Promise.allSettled(tasks);

    const translatedFilesMap = new Map<string, Map<string, string>>();
    results.forEach(result => {
      if (result.status === 'rejected') {
        console.log('\x1b[33m%s\x1b[0m', result.reason);
      }
      if (result.status === 'fulfilled') {
        translatedFilesMap.set(result.value.filename, result.value.translatedData);
      }
    });

    translatedMap.set(lang, translatedFilesMap);
  };

  const translateAssets = async () => {
    const tasks: Promise<void>[] = [];

    // Original data
    const filesMap = assetsMap.get(resolvedOptions.originalLang);
    if (filesMap) {
      // Flatten to filename => path => value
      const flatFilesMap = flattenData(filesMap)
      // Filter meta
      const filteredFilesMap = filterData(flatFilesMap);
      // Translate langs
      for (const lang of resolvedOptions.langs) {
        if (lang !== resolvedOptions.originalLang) {
          if (metaLangs.has(lang)) {
            // Update translation
            tasks.push(translateByLang(lang, filteredFilesMap));
          } else {
            // Complete translation
            tasks.push(translateByLang(lang, flatFilesMap));
          }
        }
      }

      await Promise.all(tasks);
    } else {
      throw new Error('Original asset not found');
    }
  };

  const writeAsset = async (translation: Translation, filename: string, lang: string) => {
    const baseAssets = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/${lang}`);
    if (!existsSync(baseAssets)) {
      mkdirSync(baseAssets, { recursive: true });
    }
    const data = toJsonString(translation);
    const file = normalize(`${baseAssets}/${filename}`);
    await writeFile(file, data);
    // Log
    console.log(file);
  };

  const writeMeta = async () => {
    const baseMeta = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/.metadata`);
    if (!existsSync(baseMeta)) {
      mkdirSync(baseMeta, { recursive: true });
    }
    const pathsData = toJsonString(Array.from(metaPaths));
    const pathsFile = normalize(`${baseMeta}/translated.json`);
    await writeFile(pathsFile, pathsData);
    const langsData = toJsonString(Array.from(metaLangs));
    const langsFile = normalize(`${baseMeta}/translated-langs.json`);
    await writeFile(langsFile, langsData);
    // Log
    console.log(pathsFile);
    console.log(langsFile);
  };

  const writeTranslations = async () => {
    for (const [lang, translatedFilesMap] of translatedMap) {
      for (const [filename, translatedData] of translatedFilesMap) {
        // Existing or new translation
        const translation: Translation = assetsMap.get(lang)?.get(filename) || {};
        const keys = Array.from(translatedData.keys());
        keys.forEach(key => {
          // Set meta
          metaPaths.add(key);
          // Set keys
          deepSet(translation, key.split('.'), translatedData.get(key) || '');
        });
        // Write
        await writeAsset(translation, filename, lang);
      }
      // Set meta
      metaLangs.add(lang);
    }
  };

  /**
   * START PIPELINE
   */

  /* Read meta */
  await readMeta();

  /* Read assets */
  await readAssets();

  /* Translate assets by OpenAI API */
  await translateAssets();

  /* Write translations */
  await writeTranslations();

  /* Write meta */
  await writeMeta();

  /* Log */
  console.log('\x1b[36m%s\x1b[0m', 'Total tokens: ' + usedTokens);
}

export type { GptTranslateJsonOptions };
