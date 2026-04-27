export interface ProviderConfig {
  /** Base URL for the OpenAI-compatible API */
  baseURL?: string;
}

/**
 * Registry of supported providers.
 * All providers must expose an OpenAI-compatible Chat Completions API.
 */
const providers: Record<string, ProviderConfig> = {
  openai: {
    // Default OpenAI endpoint — no override needed
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  },
};

export function getProviderConfig(provider: string): ProviderConfig {
  const config = providers[provider];
  if (!config) {
    const available = Object.keys(providers).join(', ');
    throw new Error(`Unknown provider "${provider}". Available providers: ${available}`);
  }
  return config;
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}
