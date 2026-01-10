export interface DOMContext {
  title: string;
  baseBranch: string;
  headBranch: string;
  labels: string[];
  existingDescription: string;
}

export function scrapePRPage(): DOMContext {
  const title = scrapeTitle();
  const { baseBranch, headBranch } = scrapeBranches();
  const labels = scrapeLabels();
  const existingDescription = scrapeDescription();

  return {
    title,
    baseBranch,
    headBranch,
    labels,
    existingDescription,
  };
}

function scrapeTitle(): string {
  const titleInput = document.querySelector<HTMLInputElement>(
    'input[name="pull_request[title]"]'
  );
  if (titleInput) {
    return titleInput.value.trim();
  }

  const titleElement = document.querySelector('.js-issue-title');
  if (titleElement) {
    return titleElement.textContent?.trim() ?? '';
  }

  return '';
}

function scrapeBranches(): { baseBranch: string; headBranch: string } {
  const baseRef = document.querySelector('.base-ref');
  const headRef = document.querySelector('.head-ref');

  return {
    baseBranch: baseRef?.textContent?.trim() ?? '',
    headBranch: headRef?.textContent?.trim() ?? '',
  };
}

function scrapeLabels(): string[] {
  const labelElements = document.querySelectorAll(
    '.js-issue-labels .IssueLabel'
  );
  
  if (labelElements.length > 0) {
    return Array.from(labelElements).map(
      (el) => el.textContent?.trim() ?? ''
    ).filter(Boolean);
  }

  const sidebarLabels = document.querySelectorAll(
    '[data-testid="sidebar-labels"] .IssueLabel'
  );
  
  return Array.from(sidebarLabels).map(
    (el) => el.textContent?.trim() ?? ''
  ).filter(Boolean);
}

function scrapeDescription(): string {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="pull_request[body]"]'
  );
  if (textarea) {
    return textarea.value.trim();
  }

  const bodyElement = document.querySelector('.js-comment-body');
  if (bodyElement) {
    return bodyElement.textContent?.trim() ?? '';
  }

  return '';
}

export function getPRInfoFromURL(): { owner: string; repo: string; prNumber: number } | null {
  const match = window.location.pathname.match(
    /^\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  
  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3], 10),
  };
}

export function isNewPRPage(): boolean {
  return window.location.pathname.includes('/compare/');
}

export function isPRPage(): boolean {
  return /\/pull\/\d+/.test(window.location.pathname) || isNewPRPage();
}
