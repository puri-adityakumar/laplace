import * as vscode from 'vscode';
import { buildPrompt, generateCompletion, parseGeneratedResponse } from '@laplace/shared';
import type { PRContext, DescriptionStyle } from '@laplace/shared';
import { getSettings } from '../lib/storage';
import { gatherPRContext } from '../lib/context';

export async function generateDescription(
  _context: vscode.ExtensionContext
): Promise<void> {
  const settings = getSettings();

  if (!settings.openRouterApiKey) {
    vscode.window.showErrorMessage(
      'OpenRouter API key not configured. Please set it in VS Code Settings.'
    );
    vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'laplace.openRouterApiKey'
    );
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Laplace: Generating PR description...',
      cancellable: false,
    },
    async () => {
      try {
        const prContext = await gatherPRContext(settings.githubPat);

        if (!prContext.title && !prContext.headBranch) {
          vscode.window.showWarningMessage(
            'Could not detect PR context. Make sure you have a Git repository open with commits.'
          );
          return;
        }

        const messages = buildPrompt(prContext, {
          style: settings.style as DescriptionStyle,
          generateTitle: settings.generateTitle,
          customPrompt: settings.customPrompt,
        });

        const rawResponse = await generateCompletion(settings.openRouterApiKey, {
          model: settings.model,
          messages,
        });

        const parsed = parseGeneratedResponse(rawResponse, settings.generateTitle);

        const output = settings.generateTitle && parsed.title
          ? `# ${parsed.title}\n\n${parsed.description}`
          : parsed.description;

        const doc = await vscode.workspace.openTextDocument({
          content: output,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage('PR description generated!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate description';
        vscode.window.showErrorMessage(`Laplace: ${message}`);
      }
    }
  );
}
