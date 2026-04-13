import * as vscode from 'vscode';
import { fetchCompareDiff } from '@laplace/shared';
import type { PRContext } from '@laplace/shared';

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

  const repos = gitApi.repositories as Array<{
    rootUri: vscode.Uri;
    state: {
      headBranch?: { name?: string };
      refs?: Array<{ name: string; commit?: string }>;
      workingTreeChanges?: Array<unknown>;
      indexChanges?: Array<unknown>;
    };
    diffBetween?(ref1: string, ref2: string): string[];
    log?(options?: Record<string, unknown>): Array<{ message: string }>;
  }>;

  const repo = repos.find((r) => r.rootUri.fsPath === workspaceRoot);
  if (!repo) {
    return emptyContext();
  }

  const headBranch = repo.state.headBranch?.name ?? '';
  const ownerRepo = extractOwnerRepo(workspaceRoot);

  let diff = '';
  let commits: string[] = [];

  if (ownerRepo) {
    try {
      const result = await fetchCompareDiff(
        ownerRepo.owner,
        ownerRepo.repo,
        'main',
        headBranch,
        githubPat
      );
      diff = result.diff;
      commits = result.commits;
    } catch (error) {
      console.warn('[Laplace] Failed to fetch from GitHub API:', error);
    }
  }

  return {
    title: headBranch.replace(/[-_]/g, ' ').replace(/^feature\//, ''),
    baseBranch: 'main',
    headBranch,
    labels: [],
    diff,
    commits,
    existingDescription: '',
  };
}

function extractOwnerRepo(rootPath: string): { owner: string; repo: string } | null {
  return null;
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
