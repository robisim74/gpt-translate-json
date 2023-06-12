import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { normalize } from 'path';
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai';

import { GptTranslateJsonOptions, Translation } from './types';
import { deepSet, merge } from './merge';
import { getJsonPaths, parseJson, toJsonString } from './json-functions';

/**
 * Translate Json files using ChatGPT
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
  // lang => filename => path => value
  const assetsMap = new Map<string, Map<string, Map<string, string>>>();
  // Translated data
  const translatedMap = new Map<string, Map<string, Map<string, string>>>();

  // Open AI configuration
  const configuration = new Configuration({
    apiKey: resolvedOptions.apiKey,
  });

  const openai = new OpenAIApi(configuration);

  // Count total used tokens
  let usedTokens = 0;

  const readAssets = async () => {
    for (const lang of resolvedOptions.langs) {
      const baseAssets = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/${lang}`);

      if (existsSync(baseAssets)) {
        const files = await readdir(baseAssets);

        if (files.length > 0) {
          let filesMap = new Map<string, Map<string, string>>();

          for (const filename of files) {
            let data: Translation = {};

            const source = await readFile(`${baseAssets}/${filename}`, 'utf8');
            if (source) {
              const parsed = parseJson(source);
              data = merge(data, parsed);
            }
            filesMap.set(filename, getJsonPaths(data));
          }

          assetsMap.set(lang, filesMap);
        }
      }
    }
  };

  const generatePrompt = (displayName: string, rules: string[], strData: string): string => {
    // Request
    let prompt = `Translate the following array of texts to ${displayName}: `;
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

  const translateByFile = async (
    filename: string,
    data: Map<string, string>,
    lang: string
  ): Promise<Map<string, Map<string, string>>> => {
    const displayName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || lang;

    let translatedFilesMap = new Map<string, Map<string, string>>();
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
            throw new Error('No response');
          }
        } catch (ex: any) {
          throw new Error(ex.response.statusText);
        }
      }

      const keys = Array.from(data.keys());

      // Check the match
      if (keys.length === translatedTexts.length) {
        const translatedData = new Map<string, string>();
        // Set translation
        keys.forEach((key, i) => {
          translatedData.set(key, translatedTexts[i]);
        });
        translatedFilesMap.set(filename, translatedData);
      } else {
        throw new Error('Translations mismatching');
      }
    } catch (ex: any) {
      throw new Error(`${filename}: ${ex.Message}`);
    }

    return translatedFilesMap;
  };

  const translateByLang = async (lang: string, filesMap: Map<string, Map<string, string>>) => {
    const tasks: Promise<Map<string, Map<string, string>>>[] = [];

    for (const [filename, data] of filesMap) {
      tasks.push(translateByFile(filename, data, lang));
    }

    const results = await Promise.allSettled(tasks);

    results.forEach(result => {
      if (result.status === 'rejected') {
        console.log('\x1b[33m%s\x1b[0m', result.reason);
      }
      if (result.status === 'fulfilled') {
        translatedMap.set(lang, result.value);
      }
    });
  };

  const translateAssets = async () => {
    const tasks: Promise<void>[] = [];

    for (const [lang, filesMap] of assetsMap) {
      tasks.push(translateByLang(lang, filesMap));
    }

    await Promise.all(tasks);
  };

  const writeAsset = async (translation: Translation, filename: string, lang: string) => {
    const baseAssets = normalize(`${resolvedOptions.basePath}/${resolvedOptions.assetsPath}/${lang}`);
    const data = toJsonString(translation);
    const file = normalize(`${baseAssets}/${filename}`);
    await writeFile(file, data);
    // Log
    console.log(file);
  };

  /**
   * START PIPELINE
   */

  /* Read assets */
  await readAssets();

  /* Translate assets by Open AI API */
  await translateAssets();

  /* Write translations */
  for (const [lang, translatedFilesMap] of translatedMap) {
    for (const [filename, translatedData] of translatedFilesMap) {
      const translation: Translation = {};
      const keys = Array.from(translatedData.keys());
      // Set keys
      keys.forEach(key => {
        deepSet(translation, key.split('.'), translatedData.get(key) || '');
      });
      // Write
      await writeAsset(translation, filename, lang);
    }
  }

  /* Log */
  console.log('\x1b[36m%s\x1b[0m', 'Total tokens: ' + usedTokens);
}

export type { GptTranslateJsonOptions };
