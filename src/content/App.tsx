import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { scrapePRPage, getPRInfoFromURL, isNewPRPage, isPRPage, scrapeFallbackContext } from '../lib/dom-scraper';
import type { ScrapedContext, GenerateResponse } from '../lib/types';

type Status = 'idle' | 'loading' | 'preview' | 'error' | 'success';

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [toolbarContainer, setToolbarContainer] = useState<HTMLElement | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    const findToolbar = () => {
      const selectors = [
        '.js-write-bucket .toolbar-commenting',
        '.comment-form-head .toolbar-commenting', 
        '.tabnav-tabs',
        '.js-previewable-comment-form .tabnav',
        '[data-view-component="true"].ActionBar',
      ];

      for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
          let container = document.getElementById('laplace-toolbar-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'laplace-toolbar-container';
            container.style.display = 'inline-flex';
            container.style.alignItems = 'center';
            container.style.marginLeft = '8px';
            toolbar.appendChild(container);
          }
          setToolbarContainer(container);
          return true;
        }
      }
      return false;
    };

    const tryFind = () => {
      if (!findToolbar() && retryRef.current < 10) {
        retryRef.current++;
        setTimeout(tryFind, 500);
      }
    };

    if (isPRPage()) {
      tryFind();
    }

    const observer = new MutationObserver(() => {
      if (isPRPage() && !toolbarContainer) {
        findToolbar();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [toolbarContainer]);

  const handleGenerate = useCallback(async () => {
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
        setStatus('preview');
      } else {
        throw new Error('No response received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate description';
      setError(message);
      setStatus('error');
    }
  }, []);

  const handleInsert = useCallback(() => {
    const selectors = [
      'textarea[name="pull_request[body]"]',
      'textarea#pull_request_body',
      'textarea.comment-form-textarea',
      'textarea[aria-label="Description"]',
      '#pull_request_body',
    ];

    let textarea: HTMLTextAreaElement | null = null;
    for (const selector of selectors) {
      textarea = document.querySelector<HTMLTextAreaElement>(selector);
      if (textarea) break;
    }

    if (textarea) {
      textarea.focus();
      textarea.value = description;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setDescription('');
      }, 2000);
    } else {
      setError('Could not find the description textarea. Try copying instead.');
      setStatus('error');
    }
  }, [description]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    setDescription('');
    setError('');
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(description);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setDescription('');
      }, 2000);
    } catch {
      setError('Failed to copy to clipboard');
      setStatus('error');
    }
  }, [description]);

  const toolbarButton = toolbarContainer ? createPortal(
    <ToolbarButton status={status} onClick={handleGenerate} />,
    toolbarContainer
  ) : null;

  return (
    <>
      {toolbarButton}
      
      {status === 'error' && (
        <ErrorState message={error} onRetry={handleGenerate} onClose={handleClose} />
      )}

      {status === 'preview' && (
        <PreviewPanel
          description={description}
          onInsert={handleInsert}
          onCopy={handleCopy}
          onClose={handleClose}
          onRegenerate={handleGenerate}
        />
      )}

      {status === 'success' && <SuccessState />}
    </>
  );
}

function ToolbarButton({ status, onClick }: { status: Status; onClick: () => void }) {
  const isLoading = status === 'loading';

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="laplace-toolbar-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        fontSize: '12px',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: '#2563eb',
        border: 'none',
        borderRadius: '6px',
        cursor: isLoading ? 'wait' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.currentTarget.style.backgroundColor = '#1d4ed8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2563eb';
      }}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <SparklesIcon />
          <span>Generate with AI</span>
        </>
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }}
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
    </svg>
  );
}

function SuccessState() {
  return (
    <div
      className="laplace-panel"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <CheckIcon />
      <span style={{ fontSize: 14, fontWeight: 500, color: '#065f46' }}>Done!</span>
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
      className="laplace-panel"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 350,
        padding: 16,
        backgroundColor: '#fff',
        border: '1px solid #fecaca',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ color: '#ef4444', flexShrink: 0 }}>
          <ErrorIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#991b1b' }}>Error</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#dc2626' }}>{message}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {isConfigError ? (
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Open Settings
              </button>
            ) : (
              <button
                onClick={onRetry}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 4,
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
  onInsert,
  onCopy,
  onClose,
  onRegenerate,
}: {
  description: string;
  onInsert: () => void;
  onCopy: () => void;
  onClose: () => void;
  onRegenerate: () => void;
}) {
  const wordCount = description.split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="laplace-panel"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        width: 420,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Preview
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{wordCount} words</p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: 4,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            borderRadius: 4,
          }}
        >
          <CloseIcon />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          minHeight: 120,
          maxHeight: 400,
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: 13,
            color: '#374151',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        >
          {description}
        </pre>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <button
          onClick={onInsert}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Insert into PR
        </button>
        <button
          onClick={onCopy}
          title="Copy to clipboard"
          style={{
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <CopyIcon />
        </button>
        <button
          onClick={onRegenerate}
          title="Regenerate"
          style={{
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <RefreshIcon />
        </button>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
