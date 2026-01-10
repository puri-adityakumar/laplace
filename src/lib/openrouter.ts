import { OPENROUTER_API_URL } from './constants';
import type { Model } from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: Model;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterError {
  error: {
    message: string;
    code?: string;
  };
}

export async function generateCompletion(
  apiKey: string,
  request: OpenRouterRequest
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/laplace-extension',
      'X-Title': 'Laplace PR Description Generator',
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as OpenRouterError;
    const errorMessage = errorData.error?.message || `API error: ${response.status}`;
    
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenRouter API key in settings.');
    }
    if (response.status === 402) {
      throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Please try again in a moment.');
    }
    
    throw new Error(errorMessage);
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response generated from the model.');
  }

  return data.choices[0].message.content;
}
