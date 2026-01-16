import { useState, useCallback, useEffect, useRef } from 'react';
import { scrapePRPage, getPRInfoFromURL, isNewPRPage, scrapeFallbackContext } from '../lib/dom-scraper';
import { getSettings } from '../lib/storage';
import type { ScrapedContext, GenerateResponse } from '../lib/types';

type Status = 'idle' | 'loading' | 'preview' | 'error' | 'success';

// PR page detection (strict patterns)
function isNewPRPath(pathname: string): boolean {
  return /^\/[^/]+\/[^/]+\/compare\//.test(pathname);
}

function isExistingPRPath(pathname: string): boolean {
  return /^\/[^/]+\/[^/]+\/pull\/\d+/.test(pathname);
}

function isPRPage(): boolean {
  const path = location.pathname;
  return isNewPRPath(path) || isExistingPRPath(path);
}

// DOM ready check
function isPRDOMReady(): boolean {
  if (isNewPRPath(location.pathname)) {
    // Compare page - check for compare view OR PR form
    // The PR form only appears after clicking "Create pull request"
    // So we also accept the compare header as "ready"
    return !!(
      document.querySelector('.js-compare-pr') ||  // Compare container
      document.querySelector('[data-target="compare-tab.compareDetails"]') ||
      document.querySelector('.js-details-container') ||
      document.querySelector('input#pull_request_title') ||
      document.querySelector('textarea[name="pull_request[title]"]') ||
      document.querySelector('.Subhead--spacious') // Compare header
    );
  }
  // Existing PR page
  return !!(
    document.querySelector('.js-issue-title') ||
    document.querySelector('[data-testid="issue-title"]') ||
    document.querySelector('.gh-header-title')
  );
}

// Session storage for toast throttling
const TOAST_KEY_PREFIX = 'laplace-hint-seen:';

function hasSeenHint(pathname: string): boolean {
  try {
    return sessionStorage.getItem(TOAST_KEY_PREFIX + pathname) === '1';
  } catch {
    return false;
  }
}

function markHintSeen(pathname: string): void {
  try {
    sessionStorage.setItem(TOAST_KEY_PREFIX + pathname, '1');
  } catch {
    // ignore
  }
}

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [description, setDescription] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [autoInsert, setAutoInsert] = useState(false);
  const lastPathRef = useRef<string | null>(null); // null = not yet initialized

  // Load settings
  useEffect(() => {
    getSettings().then((settings) => {
      setAutoInsert(settings.autoInject);
    });
  }, []);

  // Check if should show hint on current page
  const checkAndShowHint = useCallback(() => {
    const path = location.pathname;
    console.log('[Laplace] Checking page:', path, 'isPRPage:', isPRPage());
    
    if (!isPRPage()) {
      setShowHint(false);
      return;
    }

    // Wait for DOM to be ready
    const checkReady = (attempts = 0) => {
      const ready = isPRDOMReady();
      console.log('[Laplace] DOM ready check:', ready, 'attempt:', attempts);
      
      if (ready) {
        if (!hasSeenHint(path)) {
          console.log('[Laplace] Showing hint toast');
          setShowHint(true);
          markHintSeen(path);
          // Auto-dismiss after 5 seconds
          setTimeout(() => setShowHint(false), 5000);
        } else {
          console.log('[Laplace] Hint already seen for this path');
        }
      } else if (attempts < 20) {
        // Retry up to 20 times at 500ms = 10 seconds max
        setTimeout(() => checkReady(attempts + 1), 500);
      } else {
        console.log('[Laplace] Max attempts reached, DOM not ready');
      }
    };
    checkReady();
  }, []);

  // Navigation handler - called on path changes
  const handleNavigation = useCallback(() => {
    const currentPath = location.pathname;
    
    // Skip if path hasn't changed
    if (currentPath === lastPathRef.current) return;
    
    console.log('[Laplace] Navigation detected:', lastPathRef.current, '→', currentPath);
    lastPathRef.current = currentPath;
    
    // Reset state on navigation
    setStatus('idle');
    setDescription('');
    setGeneratedTitle('');
    setError('');
    setShowHint(false);
    
    // Check new page
    checkAndShowHint();
  }, [checkAndShowHint]);

  // SPA navigation detection via polling (more reliable than MutationObserver)
  useEffect(() => {
    // Run immediately on mount
    handleNavigation();
    
    // Poll for SPA navigation (GitHub PJAX/Turbo)
    const intervalId = window.setInterval(handleNavigation, 500);
    
    // Also listen for back/forward
    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [handleNavigation]);

  const handleGenerate = useCallback(async () => {
    if (!isPRPage()) return;
    
    setShowHint(false);
    setStatus('loading');
    setError('');

    try {
      const domContext = scrapePRPage();
      const fallbackContext = scrapeFallbackContext();
      const prInfo = getPRInfoFromURL();
      const pathMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);

      if (!pathMatch) {
        throw new Error('Could not detect repository information from URL');
      }

      const scrapedContext: ScrapedContext = {
        title: domContext.title,
        baseBranch: domContext.baseBranch,
        headBranch: domContext.headBranch,
        labels: domContext.labels,
        existingDescription: domContext.existingDescription,
        owner: prInfo?.owner ?? pathMatch[1],
        repo: prInfo?.repo ?? pathMatch[2],
        prNumber: prInfo?.prNumber ?? null,
        isNewPR: isNewPRPage(),
        fallbackCommits: fallbackContext.commits,
        fallbackFiles: fallbackContext.files,
      };

      const response: GenerateResponse = await chrome.runtime.sendMessage({
        type: 'GENERATE_PR_DESCRIPTION',
        scrapedContext,
      });

      if (response.error) {
        setError(response.error);
        setStatus('error');
      } else if (response.description) {
        setDescription(response.description);
        setGeneratedTitle(response.title || '');
        
        if (response.usedFallback) {
          setToast('Limited data available. Add a GitHub PAT for better results.');
          setTimeout(() => setToast(null), 5000);
        }

        if (autoInsert) {
          insertContent(response.description, response.title);
          setStatus('success');
          setTimeout(() => {
            setStatus('idle');
            setDescription('');
            setGeneratedTitle('');
          }, 2000);
        } else {
          setStatus('preview');
        }
      } else {
        throw new Error('No response received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate description';
      setError(message);
      setStatus('error');
    }
  }, [autoInsert]);

  // Keyboard shortcut: Alt+G
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleGenerate]);

  // Listen for messages from popup/background
  useEffect(() => {
    const handleMessage = (message: { type: string }, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
      if (message.type === 'PING') {
        // Used to detect if content script is loaded
        console.log('[Laplace] Received PING');
        sendResponse({ success: true });
        return;
      }
      
      if (message.type === 'TRIGGER_GENERATE') {
        console.log('[Laplace] Received TRIGGER_GENERATE');
        handleGenerate();
        sendResponse({ success: true });
      }
      return true; // Keep channel open for async response
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleGenerate]);

  const insertContent = (desc: string, title?: string) => {
    const descSelectors = [
      'textarea[name="pull_request[body]"]',
      'textarea#pull_request_body',
      'textarea.comment-form-textarea',
      'textarea[aria-label="Description"]',
      '#pull_request_body',
    ];

    let descTextarea: HTMLTextAreaElement | null = null;
    for (const selector of descSelectors) {
      descTextarea = document.querySelector<HTMLTextAreaElement>(selector);
      if (descTextarea) break;
    }

    if (descTextarea) {
      descTextarea.focus();
      descTextarea.value = desc;
      descTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      descTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (title) {
      const titleSelectors = [
        'input[name="pull_request[title]"]',
        'input#pull_request_title',
        'input[aria-label="Title"]',
      ];

      let titleInput: HTMLInputElement | null = null;
      for (const selector of titleSelectors) {
        titleInput = document.querySelector<HTMLInputElement>(selector);
        if (titleInput) break;
      }

      if (titleInput) {
        titleInput.focus();
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    return !!descTextarea;
  };

  const handleInsert = useCallback((insertTitle = true) => {
    const success = insertContent(description, insertTitle ? generatedTitle : undefined);
    
    if (success) {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setDescription('');
        setGeneratedTitle('');
      }, 2000);
    } else {
      setError('Could not find the description textarea. Try copying instead.');
      setStatus('error');
    }
  }, [description, generatedTitle]);

  const handleInsertTitleOnly = useCallback(() => {
    if (!generatedTitle) return;
    
    const titleSelectors = [
      'input[name="pull_request[title]"]',
      'input#pull_request_title',
      'input[aria-label="Title"]',
    ];

    let titleInput: HTMLInputElement | null = null;
    for (const selector of titleSelectors) {
      titleInput = document.querySelector<HTMLInputElement>(selector);
      if (titleInput) break;
    }

    if (titleInput) {
      titleInput.focus();
      titleInput.value = generatedTitle;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      setToast('Title inserted!');
      setTimeout(() => setToast(null), 2000);
    }
  }, [generatedTitle]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    setDescription('');
    setGeneratedTitle('');
    setError('');
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = generatedTitle 
        ? `${generatedTitle}\n\n${description}` 
        : description;
      await navigator.clipboard.writeText(textToCopy);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setDescription('');
        setGeneratedTitle('');
      }, 2000);
    } catch {
      setError('Failed to copy to clipboard');
      setStatus('error');
    }
  }, [description, generatedTitle]);

  return (
    <>
      {/* Hint Toast */}
      {showHint && (
        <HintToast onDismiss={() => setShowHint(false)} />
      )}

      {/* Loading State */}
      {status === 'loading' && <LoadingState />}
      
      {/* Error State */}
      {status === 'error' && (
        <ErrorState message={error} onRetry={handleGenerate} onClose={handleClose} />
      )}

      {/* Preview Panel */}
      {status === 'preview' && (
        <PreviewPanel
          description={description}
          title={generatedTitle}
          onInsert={handleInsert}
          onInsertTitleOnly={handleInsertTitleOnly}
          onCopy={handleCopy}
          onClose={handleClose}
          onRegenerate={handleGenerate}
        />
      )}

      {/* Success State */}
      {status === 'success' && <SuccessState />}

      {/* Info Toast (e.g., fallback warning) */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

function HintToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        color: '#fff',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontSize: 13,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <span style={{ fontSize: 18 }}>✨</span>
      <div>
        <p style={{ margin: 0, fontWeight: 500 }}>Laplace detected a PR</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
          Press <kbd style={{
            padding: '2px 6px',
            backgroundColor: '#334155',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
          }}>Alt+G</kbd> to generate description
        </p>
      </div>
      <button
        onClick={onDismiss}
        style={{
          padding: 4,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          borderRadius: 4,
          marginLeft: 8,
        }}
      >
        <CloseIcon />
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        backgroundColor: '#1e293b',
        color: '#fff',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <LoadingSpinner />
      <span>Generating PR description...</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        style={{ opacity: 0.25 }}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        style={{ opacity: 0.75 }}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

function SuccessState() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        backgroundColor: '#059669',
        color: '#fff',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <CheckIcon />
      <span style={{ fontWeight: 500 }}>Done!</span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const isConfigError = message.includes('API key') || message.includes('settings');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        maxWidth: 360,
        padding: 16,
        backgroundColor: '#fff',
        border: '1px solid #fecaca',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ color: '#ef4444', flexShrink: 0 }}>
          <ErrorIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#991b1b' }}>Error</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#dc2626' }}>{message}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {isConfigError ? (
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Open Settings
              </button>
            ) : (
              <button
                onClick={onRetry}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  description,
  title,
  onInsert,
  onInsertTitleOnly,
  onCopy,
  onClose,
  onRegenerate,
}: {
  description: string;
  title?: string;
  onInsert: (insertTitle?: boolean) => void;
  onInsertTitleOnly: () => void;
  onCopy: () => void;
  onClose: () => void;
  onRegenerate: () => void;
}) {
  const wordCount = description.split(/\s+/).filter(Boolean).length;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        width: 420,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
            Preview
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{wordCount} words</p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: 6,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            borderRadius: 6,
          }}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 120, maxHeight: 450 }}>
        {title && (
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                📝 Title
              </span>
              <button
                onClick={onInsertTitleOnly}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Insert Title
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
              {title}
            </p>
          </div>
        )}

        <div style={{ padding: 18 }}>
          {title && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              📄 Description
            </span>
          )}
          <pre
            style={{
              margin: 0,
              fontSize: 13,
              color: '#334155',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: 1.7,
            }}
          >
            {description}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 18px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          borderRadius: '0 0 12px 12px',
        }}
      >
        <button
          onClick={() => onInsert(true)}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          {title ? 'Insert Both' : 'Insert into PR'}
        </button>
        {title && (
          <button
            onClick={() => onInsert(false)}
            title="Insert description only"
            style={{
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Desc Only
          </button>
        )}
        <button
          onClick={onCopy}
          title="Copy to clipboard"
          style={{
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <CopyIcon />
        </button>
        <button
          onClick={onRegenerate}
          title="Regenerate"
          style={{
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <RefreshIcon />
        </button>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        color: '#fff',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontSize: 13,
        maxWidth: 360,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <InfoIcon />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0 }}>{message}</p>
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#60a5fa',
            fontSize: 12,
            textDecoration: 'underline',
            marginTop: 4,
            display: 'inline-block',
          }}
        >
          Create a GitHub token →
        </a>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: 4,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          borderRadius: 4,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// Icons
function CheckIcon() {
  return (
    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#60a5fa', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
