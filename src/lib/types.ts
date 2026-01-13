export type Provider = 'openrouter';

export type Model =
  | 'openai/gpt-oss-120b:free'
  | 'qwen/qwen3-coder:free'
  | 'meta-llama/llama-3.3-70b-instruct:free'
  | 'mistralai/devstral-2512:free'
  | 'anthropic/claude-sonnet-4.5'
  | string;

export type DescriptionStyle = 'short' | 'medium' | 'detailed';

export interface Settings {
  openRouterApiKey: string;
  githubPat: string;
  model: Model;
  style: DescriptionStyle;
  autoInject: boolean;
}

export interface PRContext {
  title: string;
  baseBranch: string;
  headBranch: string;
  labels: string[];
  diff: string;
  commits: string[];
  existingDescription: string;
  files?: FileChangeSummary[];
  usedFallback?: boolean;
}

export interface FileChangeSummary {
  filename: string;
  additions: number;
  deletions: number;
}

export interface GenerateRequest {
  type: 'GENERATE_PR_DESCRIPTION';
  context: PRContext;
}

export interface GenerateResponse {
  description?: string;
  error?: string;
  usedFallback?: boolean;
}

export type MessageType = 'GENERATE_PR_DESCRIPTION' | 'GET_SETTINGS' | 'SCRAPE_CONTEXT';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface ScrapedContext {
  title: string;
  baseBranch: string;
  headBranch: string;
  labels: string[];
  existingDescription: string;
  owner: string;
  repo: string;
  prNumber: number | null;
  isNewPR: boolean;
  fallbackCommits?: string[];
  fallbackFiles?: FileChangeSummary[];
}
