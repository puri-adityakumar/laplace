import { getSettings } from '../lib/storage';
import { fetchPRContext, fetchCompareDiff } from '../lib/github-api';
import { buildPrompt, parseGeneratedResponse } from '../lib/prompt';
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
  
  if (message.type === 'INJECT_AND_GENERATE' && typeof message.tabId === 'number') {
    handleInjectAndGenerate(message.tabId)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Check if content script is loaded by sending a PING
async function isContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return true;
  } catch {
    return false;
  }
}

// Inject content script if not loaded, then trigger generate
async function handleInjectAndGenerate(tabId: number): Promise<{ success: boolean; error?: string }> {
  const isLoaded = await isContentScriptLoaded(tabId);
  
  if (!isLoaded) {
    console.log('[Laplace] Content script not loaded, injecting...');
    
    try {
      // Get the compiled content script path from the manifest
      const manifest = chrome.runtime.getManifest();
      const contentScriptPath = manifest.content_scripts?.[0]?.js?.[0];
      
      if (!contentScriptPath) {
        throw new Error('Content script path not found in manifest');
      }
      
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [contentScriptPath]
      });
      
      // Also inject the CSS if present
      const cssPath = manifest.content_scripts?.[0]?.css?.[0];
      if (cssPath) {
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: [cssPath]
        });
      }
      
      // Wait a bit for React to mount
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[Laplace] Content script injected');
    } catch (error) {
      console.error('[Laplace] Failed to inject:', error);
      return { success: false, error: 'Failed to inject content script' };
    }
  }
  
  // Now trigger generate
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_GENERATE' });
    return { success: true };
  } catch (error) {
    console.error('[Laplace] Failed to trigger generate:', error);
    return { success: false, error: 'Failed to trigger generation' };
  }
}

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

  let usedFallback = false;

  if (!apiContext.diff && apiContext.commits.length === 0) {
    const hasFallbackData = 
      (scrapedContext.fallbackCommits && scrapedContext.fallbackCommits.length > 0) ||
      (scrapedContext.fallbackFiles && scrapedContext.fallbackFiles.length > 0);

    if (hasFallbackData) {
      console.log('[Laplace] Using DOM fallback data');
      usedFallback = true;
      apiContext.commits = scrapedContext.fallbackCommits || [];
    } else {
      const baseError = fetchError || 'Could not fetch PR data.';
      if (!settings.githubPat) {
        return { 
          error: `${baseError} For private repos, please add a GitHub Personal Access Token in settings.` 
        };
      }
      return { error: `${baseError} Please check your GitHub token permissions.` };
    }
  }

  const prContext: PRContext = {
    title: scrapedContext.title,
    baseBranch: scrapedContext.baseBranch,
    headBranch: scrapedContext.headBranch,
    labels: scrapedContext.labels,
    existingDescription: scrapedContext.existingDescription,
    diff: apiContext.diff,
    commits: apiContext.commits,
    files: usedFallback ? scrapedContext.fallbackFiles : undefined,
    usedFallback,
  };

  const promptOptions = {
    style: settings.style,
    generateTitle: settings.generateTitle,
    customPrompt: settings.customPrompt,
  };

  const messages = buildPrompt(prContext, promptOptions);

  try {
    const rawResponse = await generateCompletion(settings.openRouterApiKey, {
      model: settings.model,
      messages,
    });

    const parsed = parseGeneratedResponse(rawResponse, settings.generateTitle);

    return { 
      description: parsed.description, 
      title: parsed.title,
      usedFallback,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate description';
    return { error: errorMessage };
  }
}

export {};
