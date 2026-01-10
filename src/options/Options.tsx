import { useEffect, useState } from 'react';
import { Button, Input, Select, RadioGroup } from '../ui';
import { getSettings, saveSettings } from '../lib/storage';
import { MODELS } from '../lib/constants';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Laplace Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure your AI-powered PR description generator
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
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
            <p className="text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
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
            <p className="text-xs text-gray-500">
              Required for private repositories. Create one at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub Settings → Tokens
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Generation Settings
            </h2>

            <Select
              label="AI Model"
              value={settings.model}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  model: e.target.value as Settings['model'],
                })
              }
              options={MODELS.map((m) => ({ value: m.id, label: m.name }))}
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
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <Button onClick={handleSave} loading={saving}>
              Save Settings
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Settings saved!</span>
            )}
            {error && !saved && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
