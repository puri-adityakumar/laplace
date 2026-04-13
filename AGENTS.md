# AGENTS.md - Laplace

> AI-powered PR description generator — Chrome/Edge extension + VS Code extension (OpenRouter BYOK)

## Monorepo Structure

This project uses **npm workspaces**. All packages live under `packages/`.

```
laplace/
├── packages/
│   ├── shared/          # @laplace/shared — shared logic (API clients, types, prompts)
│   ├── chrome-ext/      # @laplace/chrome-ext — Chrome/Edge Manifest v3 extension
│   └── vscode-ext/      # @laplace/vscode-ext — VS Code extension
├── landing-page/        # Next.js landing page
└── package.json         # Root workspace config
```

## Build/Test/Type Commands

All commands run from the **workspace root**:

- **Install**: `npm install`
- **Build all**: `npm run build`
- **Build shared**: `npm run build:shared`
- **Build Chrome ext**: `npm run build:chrome`
- **Build VS Code ext**: `npm run build:vscode`
- **Dev Chrome ext**: `npm run dev:chrome` — Vite watch mode with HMR on port 5173
- **Dev VS Code ext**: `npm run dev:vscode` — esbuild watch mode
- **Dev Landing**: `npm run dev:landing`
- **Lint**: `npm run lint` — ESLint on chrome-ext `src/**/*.{ts,tsx}`
- **Type check**: `npm run typecheck` — `tsc --noEmit` on shared + chrome-ext
- **No test runner**: This project does not have tests configured yet

### Individual package commands

```bash
npm run build -w @laplace/shared
npm run build -w @laplace/chrome-ext
npm run dev -w @laplace/chrome-ext
npm run lint -w @laplace/chrome-ext
```

## Architecture

### Shared (`@laplace/shared`)
Platform-agnostic logic used by both extensions:
- `types.ts` — TypeScript interfaces (Settings, PRContext, GenerateResponse, etc.)
- `constants.ts` — DEFAULT_SETTINGS, MODELS, OPENROUTER_API_URL, MAX_DIFF_CHARS
- `openrouter.ts` — generateCompletion() — OpenRouter API client
- `openrouter-models.ts` — fetchOpenRouterModels(), formatPricing()
- `github-api.ts` — fetchPRContext(), fetchCompareDiff()
- `prompt.ts` — buildPrompt(), parseGeneratedResponse(), estimateTokens()

### Chrome Extension (`@laplace/chrome-ext`)
- **Manifest v3** Chrome extension with React 18 + Tailwind CSS
- `src/background/` — Service worker for API orchestration
- `src/content/` — Content script injected into GitHub PR pages
- `src/options/` — Settings page (API key, model selection, preferences)
- `src/popup/` — Quick status popup when clicking extension icon
- `src/lib/` — Chrome-specific: storage (chrome.storage), DOM scraper, context builder
- `src/ui/` — Reusable React components

### VS Code Extension (`@laplace/vscode-ext`)
- Extension host with `esbuild` bundling
- `src/extension.ts` — Entry point (activate/deactivate)
- `src/commands/generateDescription.ts` — Main command handler
- `src/lib/storage.ts` — VS Code configuration + SecretStorage wrapper
- `src/lib/context.ts` — Builds PR context via VS Code Git extension API
- Settings via VS Code `settings.json` (no separate options page)

## Key Design Decisions

- **BYOK**: User provides OpenRouter API key
  - Chrome: stored in `chrome.storage.local`
  - VS Code: stored in VS Code settings
- **Shared core**: Both extensions share OpenRouter client, GitHub API, prompt builder, types
- **No backend**: Direct API calls to OpenRouter and GitHub
- **See PRD.md** for full plan and task phases

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** (`strict: true`)
- Target: ES2020, Module: ESNext
- Path alias in chrome-ext: `@/*` maps to `src/*`
- Shared imports via `@laplace/shared`
- Unused locals/parameters must be prefixed with `_` or will error

### Imports
- Use `@laplace/shared` for shared logic (types, API clients, prompts)
- Use `@/` path alias for package-internal imports in chrome-ext
- Separate type imports: `import type { Settings } from '@laplace/shared'`
- Group imports: React, external libs, @laplace/shared, internal modules, types
- Named exports only — **no default exports**

### Naming Conventions
- **PascalCase**: Components, interfaces, type aliases (e.g., `Button`, `Settings`)
- **camelCase**: Functions, variables, properties (e.g., `getSettings`, `apiKey`)
- **UPPER_SNAKE_CASE**: Constants (e.g., `OPENROUTER_API_URL`, `MAX_DIFF_CHARS`)
- Descriptive names — no abbreviations (e.g., `openRouterApiKey` not `key`)

### Functions
- Use `async/await` over raw Promises
- Explicit return types on exported functions
- Small, focused functions (max ~50 lines)
- Error handling with typed errors and specific messages

### Error Handling
- **Never silently catch errors** — always log or re-throw with context
- Use specific error messages for common HTTP status codes (401, 403, 404, 429, etc.)
- Log with `[Laplace]` prefix for debugging: `console.error('[Laplace] Fetch failed:', error)`
- Validate inputs at function boundaries with early returns

### Components (React — Chrome ext only)
- Functional components with explicit props interfaces
- Props interfaces named `{ComponentName}Props` (e.g., `ButtonProps`)
- Destructure props in function signature
- Use Tailwind classes with `className` composition for variants
- Export from `src/ui/index.ts` barrel file

### Types & Interfaces
- Prefer `interface` for object shapes, `type` for unions/complex types
- Export all shared types from `@laplace/shared`
- Use discriminated unions for message types (e.g., `MessageType`)
- Prefix optional fields with context (e.g., `usedFallback?: boolean`)

### ESLint Rules
- `@typescript-eslint/no-unused-vars`: Error (allow `_` prefix)
- `@typescript-eslint/no-explicit-any`: Warn (avoid `any`, use `unknown` or proper types)
- Extends `@typescript-eslint/recommended`

## Extension-Specific Patterns

### Chrome Extension

#### Message Passing
- Use typed messages between content script and background worker
- Message types: `'GENERATE_PR_DESCRIPTION' | 'GET_SETTINGS' | 'SCRAPE_CONTEXT'`
- Always handle response errors in message callbacks

#### Storage
- Use `chrome.storage.local` for settings persistence
- Storage key: `'laplace-settings'`
- Merge stored partial settings with `DEFAULT_SETTINGS` defaults

### VS Code Extension

#### Settings
- Use `vscode.workspace.getConfiguration('laplace')` for settings
- API key stored in VS Code settings (user can use Settings UI)

#### Context Building
- Uses VS Code's built-in Git extension API
- Gets repo info, branch names, and diff from local Git
- Falls back to GitHub API for richer context

## File Structure

```
packages/
├── shared/
│   └── src/
│       ├── index.ts             # Barrel export
│       ├── types.ts             # All TypeScript types
│       ├── constants.ts         # Default settings, constants
│       ├── openrouter.ts        # OpenRouter API client
│       ├── openrouter-models.ts # Model catalog fetching
│       ├── github-api.ts        # GitHub API client
│       └── prompt.ts            # LLM prompt building
│
├── chrome-ext/
│   ├── manifest.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── assets/                  # Icons, fonts
│   └── src/
│       ├── background/index.ts  # Service worker entry
│       ├── content/             # Content script
│       │   ├── index.tsx
│       │   ├── App.tsx
│       │   └── styles.css
│       ├── options/             # Settings page
│       │   ├── index.html
│       │   └── Options.tsx
│       ├── popup/               # Extension popup
│       │   ├── index.html
│       │   └── Popup.tsx
│       ├── lib/                 # Chrome-specific utilities
│       │   ├── storage.ts       # chrome.storage wrapper
│       │   ├── dom-scraper.ts   # GitHub DOM scraping
│       │   └── context.ts       # Chrome context builder
│       ├── ui/                  # React components
│       └── styles/              # Theme CSS
│
└── vscode-ext/
    ├── package.json             # VS Code extension manifest
    └── src/
        ├── extension.ts         # Entry point
        ├── commands/
        │   └── generateDescription.ts
        └── lib/
            ├── storage.ts       # VS Code settings wrapper
            └── context.ts       # VS Code Git API context
```

## Development Workflow

### Chrome Extension
1. Run `npm run dev:chrome` for HMR development
2. Load extension in Chrome: `chrome://extensions/` → Developer mode → Load unpacked → Select `packages/chrome-ext/dist/`
3. Make changes — Vite rebuilds automatically
4. Run `npm run lint && npm run typecheck` before committing
5. Build with `npm run build:chrome` for production

### VS Code Extension
1. Run `npm run build:vscode` to bundle
2. Press F5 in VS Code to launch Extension Development Host
3. Or copy `packages/vscode-ext/` to VS Code extensions directory

## Common Gotchas

- Content script only runs on `github.com/*/*/compare/*` URLs (see `manifest.json`)
- Background service worker is ephemeral — don't rely on global state
- GitHub API requires PAT for private repos (stored in settings)
- Diff is truncated at 20k chars to avoid token limits
- Options page opens in new tab (not popup) per manifest configuration
- Always build `@laplace/shared` before building extensions
- VS Code extension uses `esbuild` (not Vite) for bundling
