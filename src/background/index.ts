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

  console.log('[Laplace] Scraped context:', scrapedContext);

  let apiContext = { diff: '', commits: [] as string[] };
  let fetchError: string | null = null;

  try {
    if (scrapedContext.prNumber && !scrapedContext.isNewPR) {
      console.log('[Laplace] Fetching existing PR:', scrapedContext.prNumber);
      apiContext = await fetchPRContext(
        scrapedContext.owner,
        scrapedContext.repo,
        scrapedContext.prNumber,
        settings.githubPat || undefined
      );
    } else if (scrapedContext.isNewPR) {
      let baseBranch = scrapedContext.baseBranch;
      let headBranch = scrapedContext.headBranch;

      if (baseBranch.includes(':')) {
        baseBranch = baseBranch.split(':').pop() ?? baseBranch;
      }
      if (headBranch.includes(':')) {
        headBranch = headBranch.split(':').pop() ?? headBranch;
      }

      console.log('[Laplace] Fetching compare:', { baseBranch, headBranch });

      if (baseBranch && headBranch) {
        apiContext = await fetchCompareDiff(
          scrapedContext.owner,
          scrapedContext.repo,
          baseBranch,
          headBranch,
          settings.githubPat || undefined
        );
      } else {
        fetchError = 'Could not detect branch names from the page.';
      }
    }
  } catch (error) {
    console.error('[Laplace] Failed to fetch API context:', error);
    fetchError = error instanceof Error ? error.message : 'Unknown error fetching PR data';
  }

  console.log('[Laplace] API context:', { 
    diffLength: apiContext.diff.length, 
    commitsCount: apiContext.commits.length 
  });

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
    const baseError = fetchError || 'Could not fetch PR data.';
    if (!settings.githubPat) {
      return { 
        error: `${baseError} For private repos, please add a GitHub Personal Access Token in settings.` 
      };
    }
    return { error: `${baseError} Please check your GitHub token permissions.` };
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
