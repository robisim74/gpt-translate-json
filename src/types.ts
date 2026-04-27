/**
 * GPT Translate Json Options
 */
export interface GptTranslateJsonOptions {
  /**
   * API key for the selected provider. Required
   */
  apiKey: string;
  /**
   * Chat Completion model. Required
   */
  model: string;
  /**
   * Model max tokens per request. Required
   */
  maxTokens: number;
  /**
   * AI provider. Default to 'openai'.
   * Available: 'openai', 'gemini'
   */
  provider?: string;
  /**
   * Prompt rules.
   * Defaults:
   * 'do not translate proper names'
   * 'do not translate texts enclosed in double braces {{}}'
   * 'do not translate the html tags'
   * 'do not translate URLs'
   */
  rules?: string[];
  /**
   * The base path. Default to './'
   */
  basePath?: string;
  /**
   * Path to translation files: [basePath]/[assetsPath]/[lang]/*.json. Default to 'i18n'
   */
  assetsPath?: string;
  /**
   * All supported languages. Required
   */
  langs: string[];
  /**
   * Original language. Required
   */
  originalLang: string;
}

/**
 * Translation data
 */
export type Translation = { [key: string]: any };
