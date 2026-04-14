import * as vscode from 'vscode';
import { generateDescription } from './commands/generateDescription';
import { setApiKey, setGithubPat } from './lib/storage';
import { createStatusBarItem } from './statusBar';

export function activate(context: vscode.ExtensionContext): void {
  const generateCmd = vscode.commands.registerCommand(
    'laplace.generateDescription',
    () => generateDescription(context)
  );

  const setKeyCmd = vscode.commands.registerCommand(
    'laplace.setApiKey',
    () => setApiKey(context.secrets)
  );

  const setPatCmd = vscode.commands.registerCommand(
    'laplace.setGithubPat',
    () => setGithubPat(context.secrets)
  );

  const statusBarItem = createStatusBarItem();

  context.subscriptions.push(generateCmd, setKeyCmd, setPatCmd, statusBarItem);
}

export function deactivate(): void {
}
