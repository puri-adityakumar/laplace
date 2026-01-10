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
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR not found or private repository requires authentication');
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
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR not found or private repository requires authentication');
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
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`;
  
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
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

  return { diff, commits };
}
