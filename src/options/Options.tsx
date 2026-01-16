import { useEffect, useState } from 'react';
import { Button, Input, RadioGroup, ModelSelector, LaplaceLogo } from '../ui';
import { getSettings, saveSettings } from '../lib/storage';
import type { Settings, DescriptionStyle } from '../lib/types';

const STYLE_OPTIONS = [
  {
    value: 'short',
    label: 'Short',
    description: 'Brief summary, 2-3 sentences',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced description with key changes',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive breakdown with all changes',
  },
];

export function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    if (!settings.openRouterApiKey.trim()) {
      setError('OpenRouter API key is required');
      return;
    }

    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-background bg-grid-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-subtle p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <LaplaceLogo size={40} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laplace Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your AI-powered PR description generator
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              API Configuration
            </h2>

            <Input
              label="OpenRouter API Key"
              type="password"
              placeholder="sk-or-..."
              value={settings.openRouterApiKey}
              onChange={(e) =>
                setSettings({ ...settings, openRouterApiKey: e.target.value })
              }
              error={
                error && !settings.openRouterApiKey.trim() ? error : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>

            <Input
              label="GitHub Personal Access Token (Optional)"
              type="password"
              placeholder="ghp_..."
              value={settings.githubPat}
              onChange={(e) =>
                setSettings({ ...settings, githubPat: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Required for private repositories. Create one at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Settings → Tokens
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Generation Settings
            </h2>

            <ModelSelector
              value={settings.model}
              onChange={(modelId) =>
                setSettings({
                  ...settings,
                  model: modelId,
                })
              }
            />

            <RadioGroup
              label="Description Style"
              name="style"
              value={settings.style}
              onChange={(value) =>
                setSettings({ ...settings, style: value as DescriptionStyle })
              }
              options={STYLE_OPTIONS}
            />

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Auto-insert (skip preview)
                </label>
                <p className="text-xs text-muted-foreground">
                  Insert generated content directly without showing preview
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoInject}
                onClick={() =>
                  setSettings({ ...settings, autoInject: !settings.autoInject })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                  settings.autoInject ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                    settings.autoInject ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Generate PR title
                </label>
                <p className="text-xs text-muted-foreground">
                  Also generate a suggested title for the PR
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.generateTitle}
                onClick={() =>
                  setSettings({ ...settings, generateTitle: !settings.generateTitle })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                  settings.generateTitle ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                    settings.generateTitle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Custom Prompt (Optional)
            </h2>
            <p className="text-xs text-muted-foreground">
              Override the default system prompt. Leave empty to use the built-in prompt.
            </p>
            <textarea
              value={settings.customPrompt}
              onChange={(e) =>
                setSettings({ ...settings, customPrompt: e.target.value })
              }
              placeholder="You are a senior engineer writing PR descriptions..."
              rows={5}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            />
            <p className="text-xs text-muted-foreground">
              The PR context (diff, commits, etc.) will be automatically appended.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button onClick={handleSave} loading={saving}>
              Save Settings
            </Button>
            {saved && (
              <span className="text-sm text-success">Settings saved!</span>
            )}
            {error && !saved && (
              <span className="text-sm text-destructive">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
