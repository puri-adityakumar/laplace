import { useState, useCallback, useEffect } from 'react';
import { scrapePRPage, getPRInfoFromURL, isNewPRPage, isPRPage } from '../lib/dom-scraper';
import type { ScrapedContext, GenerateResponse } from '../lib/types';

type Status = 'idle' | 'loading' | 'preview' | 'error' | 'success';

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(isPRPage());
  }, []);

  const handleGenerate = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const domContext = scrapePRPage();
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

  const handleMinimize = useCallback(() => {
    setVisible(false);
  }, []);

  const handleShow = useCallback(() => {
    setVisible(true);
  }, []);

  if (!visible) {
    return <MinimizedButton onClick={handleShow} />;
  }

  if (status === 'idle') {
    return <GenerateButton onClick={handleGenerate} onMinimize={handleMinimize} />;
  }

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return <ErrorState message={error} onRetry={handleGenerate} onClose={handleClose} />;
  }

  if (status === 'success') {
    return <SuccessState />;
  }

  if (status === 'preview') {
    return (
      <PreviewPanel
        description={description}
        onInsert={handleInsert}
        onCopy={handleCopy}
        onClose={handleClose}
        onRegenerate={handleGenerate}
      />
    );
  }

  return null;
}

function MinimizedButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Open Laplace"
      className="laplace-btn fixed bottom-4 right-4 z-[9999] p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
    >
      <SparklesIcon />
    </button>
  );
}

function GenerateButton({ onClick, onMinimize }: { onClick: () => void; onMinimize: () => void }) {
  return (
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] flex items-center gap-1">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        <SparklesIcon />
        Generate Description
      </button>
      <button
        onClick={onMinimize}
        title="Minimize"
        className="px-2 py-2 bg-blue-600 text-white text-sm rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors border-l border-blue-500"
      >
        <MinimizeIcon />
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      <div>
        <p className="text-sm font-medium text-gray-900">Generating...</p>
        <p className="text-xs text-gray-500">Analyzing PR and creating description</p>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg shadow-lg">
      <div className="text-green-600">
        <CheckIcon />
      </div>
      <p className="text-sm font-medium text-green-800">Done!</p>
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
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] max-w-sm p-4 bg-white border border-red-200 rounded-lg shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-500">
          <ErrorIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-600 mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            {isConfigError ? (
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Open Settings
              </button>
            ) : (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
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
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] w-[420px] max-h-[70vh] flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
          <p className="text-xs text-gray-500">{wordCount} words</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-[120px] max-h-[400px]">
        <div className="prose prose-sm max-w-none">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {description}
          </pre>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          onClick={onInsert}
          className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Insert into PR
        </button>
        <button
          onClick={onCopy}
          title="Copy to clipboard"
          className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <CopyIcon />
        </button>
        <button
          onClick={onRegenerate}
          title="Regenerate"
          className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <RefreshIcon />
        </button>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
