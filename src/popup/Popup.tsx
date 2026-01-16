import { useEffect, useState } from 'react';
import { getSettings } from '../lib/storage';
import type { Settings } from '../lib/types';
import { MODELS } from '../lib/constants';
import { LaplaceLogo } from '../ui';

type Status = 'loading' | 'configured' | 'not-configured';
type GenerateStatus = 'idle' | 'generating' | 'success' | 'error';

export function Popup() {
  const [status, setStatus] = useState<Status>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setStatus(s.openRouterApiKey ? 'configured' : 'not-configured');
    });
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleGenerate = async () => {
    setGenerateStatus('generating');
    setErrorMsg('');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id || !tab.url?.includes('github.com')) {
        setErrorMsg('Please open a GitHub page first');
        setGenerateStatus('error');
        return;
      }
      
      const url = new URL(tab.url);
      const isPRPage = /\/compare\/|\/pull\/\d+/.test(url.pathname);
      
      if (!isPRPage) {
        setErrorMsg('Please open a PR or compare page');
        setGenerateStatus('error');
        return;
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'INJECT_AND_GENERATE',
        tabId: tab.id
      });
      
      if (response?.success) {
        setGenerateStatus('success');
        setTimeout(() => window.close(), 500);
      } else {
        setErrorMsg(response?.error || 'Failed to generate');
        setGenerateStatus('error');
      }
    } catch (err) {
      console.error('Generate failed:', err);
      setErrorMsg('Could not trigger generation');
      setGenerateStatus('error');
    }
  };

  const getModelName = (modelId: string) => {
    return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
  };

  return (
    <div className="w-72 p-4 bg-background">
      <div className="flex items-center gap-3 mb-4">
        <LaplaceLogo size={32} />
        <div>
          <h1 className="text-lg font-bold text-foreground">Laplace</h1>
          <p className="text-xs text-muted-foreground">AI PR Descriptions</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}

      {status === 'configured' && settings && (
        <div className="space-y-3">
          <div className="bg-success/10 border border-success/30 rounded-md p-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-success"
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
              <span className="text-sm font-medium text-success">
                Ready to use
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Model:</span>{' '}
              {getModelName(settings.model)}
            </p>
            <p>
              <span className="font-medium text-foreground">Style:</span>{' '}
              <span className="capitalize">{settings.style}</span>
            </p>
            <p>
              <span className="font-medium text-foreground">GitHub PAT:</span>{' '}
              {settings.githubPat ? 'Configured' : 'Not set'}
            </p>
          </div>
        </div>
      )}

      {status === 'not-configured' && (
        <div className="bg-warning/10 border border-warning/30 rounded-md p-3 mb-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-warning"
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
            <span className="text-sm font-medium text-warning">
              Setup required
            </span>
          </div>
          <p className="text-xs text-warning/80 mt-1">
            Add your OpenRouter API key to get started
          </p>
        </div>
      )}

      {status === 'configured' && (
        <button
          onClick={handleGenerate}
          disabled={generateStatus === 'generating'}
          className="w-full mt-3 px-3 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
        >
          {generateStatus === 'generating' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : generateStatus === 'success' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Done!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Generate PR Description
            </>
          )}
        </button>
      )}

      {generateStatus === 'error' && errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}

      {status === 'configured' && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono text-xs">Alt+G</kbd> on any PR page
        </p>
      )}

      <button
        onClick={openOptions}
        className="w-full mt-3 px-3 py-2 text-sm text-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors border border-border"
      >
        {status === 'configured' ? 'Settings' : 'Configure Extension'}
      </button>
    </div>
  );
}
