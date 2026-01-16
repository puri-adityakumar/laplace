import { useState, useEffect, useMemo } from 'react';
import { MODELS } from '../lib/constants';
import { fetchOpenRouterModels, formatPricing, type OpenRouterModel } from '../lib/openrouter-models';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    if (allModels.length === 0) {
      setLoading(true);
      const models = await fetchOpenRouterModels();
      setAllModels(models);
      setLoading(false);
    }
  };

  const filteredModels = useMemo(() => {
    if (!search.trim()) return allModels.slice(0, 50);
    const query = search.toLowerCase();
    return allModels
      .filter((m) => 
        m.id.toLowerCase().includes(query) || 
        m.name.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [allModels, search]);

  const handleSelectModel = (modelId: string) => {
    onChange(modelId);
    setIsModalOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">AI Model</label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === '__browse__') {
              handleOpenModal();
            } else {
              onChange(e.target.value);
            }
          }}
          className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <optgroup label="Featured Models">
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.free ? '(Free)' : ''}
              </option>
            ))}
          </optgroup>
          <option value="__browse__">🔍 Browse all models...</option>
        </select>
      </div>

      {!MODELS.find((m) => m.id === value) && value !== '__browse__' && (
        <p className="text-xs text-muted-foreground">Custom: {value}</p>
      )}

      {isModalOpen && (
        <ModelModal
          models={filteredModels}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelectModel}
          onClose={() => {
            setIsModalOpen(false);
            setSearch('');
          }}
          totalCount={allModels.length}
        />
      )}
    </div>
  );
}

interface ModelModalProps {
  models: OpenRouterModel[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (modelId: string) => void;
  onClose: () => void;
  totalCount: number;
}

function ModelModal({ 
  models, 
  loading, 
  search, 
  onSearchChange, 
  onSelect, 
  onClose,
  totalCount 
}: ModelModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[80vh] bg-card rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-foreground">Select Model</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-2 text-muted-foreground">Loading models...</span>
            </div>
          ) : models.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No models found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {models.map((model) => (
                <li key={model.id}>
                  <button
                    onClick={() => onSelect(model.id)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {model.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{model.id}</p>
                    </div>
                    <span className={`ml-3 text-xs font-medium px-2 py-1 rounded ${
                      formatPricing(model) === 'Free' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {formatPricing(model)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalCount > 0 && (
          <div className="px-4 py-2 border-t bg-muted text-xs text-muted-foreground text-center">
            Showing {models.length} of {totalCount} models
          </div>
        )}
      </div>
    </div>
  );
}
