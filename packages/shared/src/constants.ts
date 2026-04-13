import type { Model, Settings } from './types';

export const MODELS: { id: Model; name: string; free?: boolean }[] = [
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', free: true },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', free: true },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', free: true },
  { id: 'mistralai/devstral-2512:free', name: 'Devstral', free: true },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
];

export const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: '',
  githubPat: '',
  model: 'openai/gpt-oss-120b:free',
  style: 'medium',
  autoInject: true,
  generateTitle: false,
  customPrompt: '',
};

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const MAX_DIFF_CHARS = 20000;
