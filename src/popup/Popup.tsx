import { useEffect, useState } from 'react';
import { getSettings } from '../lib/storage';
import type { Settings } from '../lib/types';
import { MODELS } from '../lib/constants';

type Status = 'loading' | 'configured' | 'not-configured';

export function Popup() {
  const [status, setStatus] = useState<Status>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setStatus(s.openRouterApiKey ? 'configured' : 'not-configured');
    });
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const getModelName = (modelId: string) => {
    return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
  };

  return (
    <div className="w-72 p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Laplace</h1>
          <p className="text-xs text-gray-500">AI PR Descriptions</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      )}

      {status === 'configured' && settings && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Ready to use
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Model:</span>{' '}
              {getModelName(settings.model)}
            </p>
            <p>
              <span className="font-medium">Style:</span>{' '}
              <span className="capitalize">{settings.style}</span>
            </p>
            <p>
              <span className="font-medium">GitHub PAT:</span>{' '}
              {settings.githubPat ? 'Configured' : 'Not set'}
            </p>
          </div>
        </div>
      )}

      {status === 'not-configured' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              Setup required
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Add your OpenRouter API key to get started
          </p>
        </div>
      )}

      <button
        onClick={openOptions}
        className="w-full mt-3 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {status === 'configured' ? 'Settings' : 'Configure Extension'}
      </button>
    </div>
  );
}
