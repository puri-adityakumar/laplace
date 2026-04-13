import * as vscode from 'vscode';
import type { Model, DescriptionStyle } from '@laplace/shared';

export interface VSCodeSettings {
  openRouterApiKey: string;
  githubPat: string;
  model: Model;
  style: DescriptionStyle;
  generateTitle: boolean;
  customPrompt: string;
}

export function getSettings(): VSCodeSettings {
  const config = vscode.workspace.getConfiguration('laplace');

  return {
    openRouterApiKey: config.get<string>('openRouterApiKey', ''),
    githubPat: config.get<string>('githubPat', ''),
    model: config.get<string>('model', 'openai/gpt-oss-120b:free') as Model,
    style: config.get<DescriptionStyle>('style', 'medium'),
    generateTitle: config.get<boolean>('generateTitle', false),
    customPrompt: config.get<string>('customPrompt', ''),
  };
}
