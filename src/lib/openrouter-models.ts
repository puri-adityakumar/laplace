export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface CachedModels {
  models: OpenRouterModel[];
  timestamp: number;
}

const CACHE_KEY = 'laplace-openrouter-models';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const cached = await getCachedModels();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data.map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: m.name as string,
      pricing: m.pricing as { prompt: string; completion: string },
    }));

    await cacheModels(models);
    return models;
  } catch (error) {
    console.error('[Laplace] Failed to fetch OpenRouter models:', error);
    return [];
  }
}

async function getCachedModels(): Promise<OpenRouterModel[] | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      const cached = result[CACHE_KEY] as CachedModels | undefined;
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        resolve(cached.models);
      } else {
        resolve(null);
      }
    });
  });
}

async function cacheModels(models: OpenRouterModel[]): Promise<void> {
  return new Promise((resolve) => {
    const cached: CachedModels = {
      models,
      timestamp: Date.now(),
    };
    chrome.storage.local.set({ [CACHE_KEY]: cached }, resolve);
  });
}

export function formatPricing(model: OpenRouterModel): string {
  const promptPrice = parseFloat(model.pricing?.prompt || '0');
  if (promptPrice === 0) {
    return 'Free';
  }
  const perMillion = promptPrice * 1_000_000;
  if (perMillion < 0.01) {
    return `$${perMillion.toFixed(4)}/1M`;
  }
  return `$${perMillion.toFixed(2)}/1M`;
}
