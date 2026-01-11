import type { Model, Settings } from './types';

export const MODELS: { id: Model; name: string }[] = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
];

export const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: '',
  githubPat: '',
  model: 'anthropic/claude-sonnet-4',
  style: 'medium',
  autoInject: true,
};

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const MAX_DIFF_CHARS = 20000;
