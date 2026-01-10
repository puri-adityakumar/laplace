import type { PRContext } from './types';
import { scrapePRPage, getPRInfoFromURL, isNewPRPage } from './dom-scraper';
import { fetchPRContext, fetchCompareDiff } from './github-api';

export interface ContextOptions {
  githubPat?: string;
}

export async function gatherPRContext(options: ContextOptions = {}): Promise<PRContext> {
  const domContext = scrapePRPage();
  
  let apiContext = { diff: '', commits: [] as string[] };
  
  const prInfo = getPRInfoFromURL();
  
  if (prInfo && !isNewPRPage()) {
    try {
      apiContext = await fetchPRContext(
        prInfo.owner,
        prInfo.repo,
        prInfo.prNumber,
        options.githubPat
      );
    } catch (error) {
      console.warn('[Laplace] Failed to fetch PR context from API:', error);
    }
  } else if (isNewPRPage() && domContext.baseBranch && domContext.headBranch) {
    const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);
    if (match) {
      try {
        apiContext = await fetchCompareDiff(
          match[1],
          match[2],
          domContext.baseBranch,
          domContext.headBranch,
          options.githubPat
        );
      } catch (error) {
        console.warn('[Laplace] Failed to fetch compare context:', error);
      }
    }
  }

  return {
    title: domContext.title,
    baseBranch: domContext.baseBranch,
    headBranch: domContext.headBranch,
    labels: domContext.labels,
    existingDescription: domContext.existingDescription,
    diff: apiContext.diff,
    commits: apiContext.commits,
  };
}

export function validateContext(context: PRContext): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.title && !context.headBranch) {
    errors.push('Could not detect PR title or branch');
  }

  if (!context.diff && context.commits.length === 0) {
    errors.push('No diff or commits found - may need GitHub PAT for private repos');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
