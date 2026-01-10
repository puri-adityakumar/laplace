import { MAX_DIFF_CHARS } from './constants';

export interface GitHubAPIContext {
  diff: string;
  commits: string[];
}

interface GitHubCommit {
  commit: {
    message: string;
  };
}

export async function fetchPRContext(
  owner: string,
  repo: string,
  prNumber: number,
  pat?: string
): Promise<GitHubAPIContext> {
  const [diff, commits] = await Promise.all([
    fetchDiff(owner, repo, prNumber, pat),
    fetchCommits(owner, repo, prNumber, pat),
  ]);

  return { diff, commits };
}

async function fetchDiff(
  owner: string,
  repo: string,
  prNumber: number,
  pat?: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.diff',
    'User-Agent': 'Laplace-Extension',
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  console.log('[Laplace] Fetching diff from:', url);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('[Laplace] Diff fetch failed:', response.status, text);
    if (response.status === 404) {
      throw new Error('PR not found or private repository requires authentication');
    }
    if (response.status === 403) {
      throw new Error('Rate limited or forbidden. Try adding a GitHub PAT.');
    }
    throw new Error(`Failed to fetch diff: ${response.status}`);
  }

  const diff = await response.text();
  
  if (diff.length > MAX_DIFF_CHARS) {
    return truncateDiff(diff, MAX_DIFF_CHARS);
  }

  return diff;
}

async function fetchCommits(
  owner: string,
  repo: string,
  prNumber: number,
  pat?: string
): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`;
  
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Laplace-Extension',
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  console.log('[Laplace] Fetching commits from:', url);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('[Laplace] Commits fetch failed:', response.status, text);
    if (response.status === 404) {
      throw new Error('PR not found or private repository requires authentication');
    }
    if (response.status === 403) {
      throw new Error('Rate limited or forbidden. Try adding a GitHub PAT.');
    }
    throw new Error(`Failed to fetch commits: ${response.status}`);
  }

  const commits: GitHubCommit[] = await response.json();
  
  return commits.map((c) => c.commit.message);
}

function truncateDiff(diff: string, maxChars: number): string {
  const lines = diff.split('\n');
  let result = '';
  let currentLength = 0;

  for (const line of lines) {
    if (currentLength + line.length + 1 > maxChars) {
      result += '\n... [diff truncated due to size]';
      break;
    }
    result += (result ? '\n' : '') + line;
    currentLength += line.length + 1;
  }

  return result;
}

export async function fetchCompareDiff(
  owner: string,
  repo: string,
  base: string,
  head: string,
  pat?: string
): Promise<GitHubAPIContext> {
  const encodedBase = encodeURIComponent(base);
  const encodedHead = encodeURIComponent(head);
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${encodedBase}...${encodedHead}`;
  
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Laplace-Extension',
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  console.log('[Laplace] Fetching compare from:', url);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('[Laplace] Compare fetch failed:', response.status, text);
    if (response.status === 404) {
      throw new Error('Branches not found or repository requires authentication');
    }
    if (response.status === 403) {
      throw new Error('Rate limited or forbidden. Try adding a GitHub PAT.');
    }
    throw new Error(`Failed to fetch compare: ${response.status}`);
  }

  const data = await response.json();
  
  const commits: string[] = data.commits?.map(
    (c: GitHubCommit) => c.commit.message
  ) ?? [];

  let diff = '';
  if (data.files) {
    diff = data.files
      .map((f: { filename: string; patch?: string }) => 
        `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch ?? ''}`
      )
      .join('\n\n');
  }

  if (diff.length > MAX_DIFF_CHARS) {
    diff = truncateDiff(diff, MAX_DIFF_CHARS);
  }

  console.log('[Laplace] Compare result:', { diffLength: diff.length, commitsCount: commits.length });

  return { diff, commits };
}
