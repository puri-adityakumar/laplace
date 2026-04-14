import * as vscode from 'vscode';
import type { Model, DescriptionStyle } from '@laplace/shared';

const SECRET_API_KEY = 'laplace.openRouterApiKey';
const SECRET_GITHUB_PAT = 'laplace.githubPat';

export interface VSCodeSettings {
  openRouterApiKey: string;
  githubPat: string;
  model: Model;
  style: DescriptionStyle;
  generateTitle: boolean;
  customPrompt: string;
  baseBranch: string;
}

export async function getSettings(secrets: vscode.SecretStorage): Promise<VSCodeSettings> {
  const config = vscode.workspace.getConfiguration('laplace');

  const openRouterApiKey = (await secrets.get(SECRET_API_KEY)) ?? '';
  const githubPat = (await secrets.get(SECRET_GITHUB_PAT)) ?? '';

  return {
    openRouterApiKey,
    githubPat,
    model: config.get<string>('model', 'openai/gpt-oss-120b:free') as Model,
    style: config.get<DescriptionStyle>('style', 'medium'),
    generateTitle: config.get<boolean>('generateTitle', false),
    customPrompt: config.get<string>('customPrompt', ''),
    baseBranch: config.get<string>('baseBranch', ''),
  };
}

export async function setApiKey(secrets: vscode.SecretStorage): Promise<void> {
  const key = await vscode.window.showInputBox({
    prompt: 'Enter your OpenRouter API key',
    password: true,
    ignoreFocusOut: true,
    placeHolder: 'sk-or-...',
  });

  if (key !== undefined) {
    await secrets.store(SECRET_API_KEY, key);
    vscode.window.showInformationMessage('Laplace: OpenRouter API key saved securely.');
  }
}

export async function setGithubPat(secrets: vscode.SecretStorage): Promise<void> {
  const pat = await vscode.window.showInputBox({
    prompt: 'Enter your GitHub Personal Access Token',
    password: true,
    ignoreFocusOut: true,
    placeHolder: 'ghp_...',
  });

  if (pat !== undefined) {
    await secrets.store(SECRET_GITHUB_PAT, pat);
    vscode.window.showInformationMessage('Laplace: GitHub PAT saved securely.');
  }
}
