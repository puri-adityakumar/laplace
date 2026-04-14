import * as vscode from 'vscode';
import { buildPrompt, generateCompletion, parseGeneratedResponse } from '@laplace/shared';
import type { DescriptionStyle } from '@laplace/shared';
import { getSettings } from '../lib/storage';
import { gatherPRContext, validateContext } from '../lib/context';

export async function generateDescription(
  context: vscode.ExtensionContext
): Promise<void> {
  const settings = await getSettings(context.secrets);

  if (!settings.openRouterApiKey) {
    const action = await vscode.window.showErrorMessage(
      'OpenRouter API key not configured.',
      'Set API Key'
    );
    if (action === 'Set API Key') {
      vscode.commands.executeCommand('laplace.setApiKey');
    }
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Laplace',
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ message: 'Gathering PR context...', increment: 10 });

        const prContext = await gatherPRContext(settings.githubPat);

        const validation = validateContext(prContext);
        if (!validation.valid) {
          const detail = validation.errors.join('\n');
          vscode.window.showWarningMessage(
            `Laplace: Limited context — ${validation.errors[0]}`,
            { detail, modal: false }
          );
        }

        if (!prContext.diff && prContext.commits.length === 0 && !prContext.title && !prContext.headBranch) {
          vscode.window.showErrorMessage(
            'Could not detect PR context. Make sure you have a Git repository open with commits.'
          );
          return;
        }

        progress.report({ message: 'Generating description...', increment: 30 });

        const messages = buildPrompt(prContext, {
          style: settings.style as DescriptionStyle,
          generateTitle: settings.generateTitle,
          customPrompt: settings.customPrompt,
        });

        const rawResponse = await generateCompletion(settings.openRouterApiKey, {
          model: settings.model,
          messages,
        });

        progress.report({ message: 'Done!', increment: 60 });

        const parsed = parseGeneratedResponse(rawResponse, settings.generateTitle);

        const output = settings.generateTitle && parsed.title
          ? `# ${parsed.title}\n\n${parsed.description}`
          : parsed.description;

        const doc = await vscode.workspace.openTextDocument({
          content: output,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

        const copyAction = await vscode.window.showInformationMessage(
          'PR description generated!',
          'Copy to Clipboard'
        );

        if (copyAction === 'Copy to Clipboard') {
          await vscode.env.clipboard.writeText(output);
          vscode.window.showInformationMessage('Copied to clipboard!');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate description';
        vscode.window.showErrorMessage(`Laplace: ${message}`);
      }
    }
  );
}
