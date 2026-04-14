import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { fetchCompareDiff } from '@laplace/shared';
import { MAX_DIFF_CHARS } from '@laplace/shared';
import type { PRContext } from '@laplace/shared';

interface GitRepository {
  rootUri: vscode.Uri;
  state: {
    headBranch?: { name?: string };
    refs?: Array<{ name: string; commit?: string }>;
    workingTreeChanges?: Array<unknown>;
    indexChanges?: Array<unknown>;
  };
}

export async function gatherPRContext(githubPat?: string): Promise<PRContext> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return emptyContext();
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const gitApi = vscode.extensions.getExtension('vscode.git')?.exports?.getAPI(1);

  if (!gitApi) {
    return emptyContext();
  }

  const repos = gitApi.repositories as GitRepository[];
  const repo = repos.find((r) => r.rootUri.fsPath === workspaceRoot);
  if (!repo) {
    return emptyContext();
  }

  const headBranch = repo.state.headBranch?.name ?? '';
  const ownerRepo = extractOwnerRepo(workspaceRoot);
  const baseBranch = detectBaseBranch(repo, workspaceRoot);

  let diff = '';
  let commits: string[] = [];
  let usedFallback = false;

  if (ownerRepo && headBranch) {
    try {
      const result = await fetchCompareDiff(
        ownerRepo.owner,
        ownerRepo.repo,
        baseBranch,
        headBranch,
        githubPat
      );
      diff = result.diff;
      commits = result.commits;
    } catch (error) {
      console.warn('[Laplace] GitHub API failed, falling back to local git:', error);
      const localResult = getLocalGitDiff(workspaceRoot, baseBranch, headBranch);
      diff = localResult.diff;
      commits = localResult.commits;
      usedFallback = true;
    }
  } else if (headBranch) {
    const localResult = getLocalGitDiff(workspaceRoot, baseBranch, headBranch);
    diff = localResult.diff;
    commits = localResult.commits;
    usedFallback = true;
  }

  return {
    title: headBranch.replace(/[-_]/g, ' ').replace(/^feature\//, ''),
    baseBranch,
    headBranch,
    labels: [],
    diff,
    commits,
    existingDescription: '',
    usedFallback,
  };
}

export function extractOwnerRepo(rootPath: string): { owner: string; repo: string } | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: rootPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    return parseGitRemoteUrl(remoteUrl);
  } catch {
    return null;
  }
}

function parseGitRemoteUrl(url: string): { owner: string; repo: string } | null {
  let match: RegExpMatchArray | null;

  match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  match = url.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  match = url.match(/^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

function detectBaseBranch(repo: GitRepository, rootPath: string): string {
  const config = vscode.workspace.getConfiguration('laplace');
  const configured = config.get<string>('baseBranch', '');
  if (configured) {
    return configured;
  }

  const refs = repo.state.refs ?? [];

  const headSymRef = refs.find((r) => r.name === 'refs/remotes/origin/HEAD');
  if (headSymRef?.commit) {
    const defaultBranch = refs.find(
      (r) => r.commit === headSymRef.commit && r.name !== 'refs/remotes/origin/HEAD'
    );
    if (defaultBranch?.name) {
      return defaultBranch.name.replace(/^refs\/remotes\/origin\//, '');
    }
  }

  try {
    const output = execSync('git remote show origin', {
      cwd: rootPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const match = output.match(/HEAD branch:\s*(.+)/);
    if (match) {
      return match[1].trim();
    }
  } catch {
    // ignore
  }

  const mainRef = refs.find((r) => r.name === 'refs/heads/main' || r.name === 'refs/remotes/origin/main');
  if (mainRef) {
    return 'main';
  }

  const masterRef = refs.find((r) => r.name === 'refs/heads/master' || r.name === 'refs/remotes/origin/master');
  if (masterRef) {
    return 'master';
  }

  return 'main';
}

function getLocalGitDiff(
  rootPath: string,
  baseBranch: string,
  _headBranch: string
): { diff: string; commits: string[] } {
  try {
    let diff = '';
    try {
      diff = execSync(`git diff ${baseBranch}...HEAD`, {
        cwd: rootPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      diff = execSync('git diff --cached', {
        cwd: rootPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
      });
    }

    if (diff.length > MAX_DIFF_CHARS) {
      diff = diff.substring(0, MAX_DIFF_CHARS) + '\n... [diff truncated due to size]';
    }

    let commits: string[] = [];
    try {
      const logOutput = execSync(`git log ${baseBranch}..HEAD --pretty=format:"%s"`, {
        cwd: rootPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      commits = logOutput.split('\n').filter(Boolean);
    } catch {
      // ignore
    }

    return { diff, commits };
  } catch (error) {
    console.warn('[Laplace] Local git fallback failed:', error);
    return { diff: '', commits: [] };
  }
}

export function validateContext(context: PRContext): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.title && !context.headBranch) {
    errors.push('Could not detect PR title or branch. Make sure you have a Git repository open.');
  }

  if (!context.diff && context.commits.length === 0) {
    errors.push('No diff or commits found. Commit some changes first or check your branch setup.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function emptyContext(): PRContext {
  return {
    title: '',
    baseBranch: '',
    headBranch: '',
    labels: [],
    diff: '',
    commits: [],
    existingDescription: '',
  };
}
