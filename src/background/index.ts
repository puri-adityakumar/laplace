import { getSettings } from '../lib/storage';
import { fetchPRContext, fetchCompareDiff } from '../lib/github-api';
import { buildPrompt } from '../lib/prompt';
import { generateCompletion } from '../lib/openrouter';
import type { PRContext, GenerateResponse, ScrapedContext } from '../lib/types';

interface GenerateMessage {
  type: 'GENERATE_PR_DESCRIPTION';
  scrapedContext: ScrapedContext;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GENERATE_PR_DESCRIPTION') {
    handleGeneratePR(message as GenerateMessage)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleGeneratePR(
  message: GenerateMessage
): Promise<GenerateResponse> {
  const settings = await getSettings();

  if (!settings.openRouterApiKey) {
    return { error: 'OpenRouter API key not configured. Please set it in the extension settings.' };
  }

  const { scrapedContext } = message;

  let apiContext = { diff: '', commits: [] as string[] };

  try {
    if (scrapedContext.prNumber && !scrapedContext.isNewPR) {
      apiContext = await fetchPRContext(
        scrapedContext.owner,
        scrapedContext.repo,
        scrapedContext.prNumber,
        settings.githubPat || undefined
      );
    } else if (scrapedContext.isNewPR && scrapedContext.baseBranch && scrapedContext.headBranch) {
      apiContext = await fetchCompareDiff(
        scrapedContext.owner,
        scrapedContext.repo,
        scrapedContext.baseBranch,
        scrapedContext.headBranch,
        settings.githubPat || undefined
      );
    }
  } catch (error) {
    console.warn('[Laplace] Failed to fetch API context:', error);
  }

  const prContext: PRContext = {
    title: scrapedContext.title,
    baseBranch: scrapedContext.baseBranch,
    headBranch: scrapedContext.headBranch,
    labels: scrapedContext.labels,
    existingDescription: scrapedContext.existingDescription,
    diff: apiContext.diff,
    commits: apiContext.commits,
  };

  if (!prContext.diff && prContext.commits.length === 0) {
    if (!settings.githubPat) {
      return { 
        error: 'Could not fetch PR data. For private repos, please add a GitHub Personal Access Token in settings.' 
      };
    }
    return { error: 'Could not fetch PR diff or commits. Please check your GitHub token permissions.' };
  }

  const messages = buildPrompt(prContext, settings.style);

  try {
    const description = await generateCompletion(settings.openRouterApiKey, {
      model: settings.model,
      messages,
    });

    return { description };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate description';
    return { error: errorMessage };
  }
}

export {};
