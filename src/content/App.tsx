import { useState, useCallback } from 'react';
import { scrapePRPage, getPRInfoFromURL, isNewPRPage } from '../lib/dom-scraper';
import type { ScrapedContext, GenerateResponse } from '../lib/types';

type Status = 'idle' | 'loading' | 'preview' | 'error';

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const domContext = scrapePRPage();
      const prInfo = getPRInfoFromURL();
      const pathMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);

      const scrapedContext: ScrapedContext = {
        title: domContext.title,
        baseBranch: domContext.baseBranch,
        headBranch: domContext.headBranch,
        labels: domContext.labels,
        existingDescription: domContext.existingDescription,
        owner: prInfo?.owner ?? pathMatch?.[1] ?? '',
        repo: prInfo?.repo ?? pathMatch?.[2] ?? '',
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate description');
      setStatus('error');
    }
  }, []);

  const handleInsert = useCallback(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="pull_request[body]"], textarea#pull_request_body, textarea.comment-form-textarea'
    );

    if (textarea) {
      textarea.value = description;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      setStatus('idle');
      setDescription('');
    } else {
      setError('Could not find the description textarea');
      setStatus('error');
    }
  }, [description]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    setDescription('');
    setError('');
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(description);
  }, [description]);

  if (status === 'idle') {
    return <GenerateButton onClick={handleGenerate} />;
  }

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return <ErrorState message={error} onRetry={handleGenerate} onClose={handleClose} />;
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

function GenerateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="laplace-btn fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
    >
      <SparklesIcon />
      Generate PR Description
    </button>
  );
}

function LoadingState() {
  return (
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      <span className="text-sm text-gray-700">Generating description...</span>
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
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
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
  return (
    <div className="laplace-panel fixed bottom-4 right-4 z-[9999] w-96 max-h-[70vh] flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Generated Description</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {description}
        </pre>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onInsert}
          className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Insert
        </button>
        <button
          onClick={onCopy}
          className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Copy
        </button>
        <button
          onClick={onRegenerate}
          className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Regenerate
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
