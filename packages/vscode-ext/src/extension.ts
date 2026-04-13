import * as vscode from 'vscode';
import { generateDescription } from './commands/generateDescription';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'laplace.generateDescription',
    () => generateDescription(context)
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
}
