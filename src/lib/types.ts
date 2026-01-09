export type Provider = 'openrouter';

export type Model =
  | 'anthropic/claude-sonnet-4'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'meta-llama/llama-3.1-70b-instruct'
  | 'mistralai/mistral-large';

export type DescriptionStyle = 'short' | 'medium' | 'detailed';

export interface Settings {
  openRouterApiKey: string;
  githubPat: string;
  model: Model;
  style: DescriptionStyle;
}

export interface PRContext {
  title: string;
  baseBranch: string;
  headBranch: string;
  labels: string[];
  diff: string;
  commits: string[];
  existingDescription: string;
}

export interface GenerateRequest {
  type: 'GENERATE_PR_DESCRIPTION';
  context: PRContext;
}

export interface GenerateResponse {
  description?: string;
  error?: string;
}

export interface MessageMap {
  GENERATE_PR_DESCRIPTION: {
    request: GenerateRequest;
    response: GenerateResponse;
  };
}
