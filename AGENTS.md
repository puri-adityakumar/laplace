# AGENTS.md - Laplace

> Chrome/Edge extension for auto-generating GitHub PR descriptions using AI (OpenRouter BYOK)

## Build/Test/Type Commands

- **Install**: `pnpm install`
- **Dev**: `pnpm dev` — Vite watch mode with HMR on port 5173
- **Build**: `pnpm build` — TypeScript compile + Vite build (outputs to `dist/`)
- **Lint**: `pnpm lint` — ESLint on `src/**/*.{ts,tsx}`
- **Lint fix**: `pnpm lint -- --fix` — Auto-fix ESLint issues
- **Type check**: `pnpm typecheck` — `tsc --noEmit` strict mode validation
- **No test runner**: This project does not have tests configured yet

## Architecture

- **Manifest v3** Chrome extension with React 18 + Tailwind CSS
- **src/background/** — Service worker for API orchestration (OpenRouter + GitHub)
- **src/content/** — Content script injected into GitHub PR pages (`/compare/*`)
- **src/options/** — Settings page (API key, model selection, preferences)
- **src/popup/** — Quick status popup when clicking extension icon
- **src/lib/** — Shared utilities (types, storage, API clients, DOM scraper, prompts)
- **src/ui/** — Reusable React components with named exports

## Key Design Decisions

- **BYOK**: User provides OpenRouter API key (stored in `chrome.storage.local`)
- **Hybrid fetching**: DOM scraping for title/branches/labels, GitHub API for diff/commits
- **No backend**: Direct API calls to OpenRouter and GitHub from background worker
- **See PRD.md** for full plan and task phases (gitignored, local only)

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** (`strict: true` in tsconfig.json)
- Target: ES2020, Module: ESNext, JSX: react-jsx
- Path alias: `@/*` maps to `src/*`
- Unused locals/parameters must be prefixed with `_` or will error

### Imports
- Use `@/` path alias for imports from `src/` (e.g., `import { Button } from '@/ui/Button'`)
- Separate type imports: `import type { Settings } from './types'`
- Group imports: React, external libs, internal modules, types
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

### Components (React)
- Functional components with explicit props interfaces
- Props interfaces named `{ComponentName}Props` (e.g., `ButtonProps`)
- Destructure props in function signature
- Use Tailwind classes with `className` composition for variants
- Export from `src/ui/index.ts` barrel file

### Types & Interfaces
- Prefer `interface` for object shapes, `type` for unions/complex types
- Export all shared types from `src/lib/types.ts`
- Use discriminated unions for message types (e.g., `MessageType`)
- Prefix optional fields with context (e.g., `usedFallback?: boolean`)

### ESLint Rules
- `@typescript-eslint/no-unused-vars`: Error (allow `_` prefix)
- `@typescript-eslint/no-explicit-any`: Warn (avoid `any`, use `unknown` or proper types)
- Extends `@typescript-eslint/recommended`

## Extension-Specific Patterns

### Message Passing
- Use typed messages between content script and background worker
- Message types: `'GENERATE_PR_DESCRIPTION' | 'GET_SETTINGS' | 'SCRAPE_CONTEXT'`
- Always handle response errors in message callbacks

### Storage
- Use `chrome.storage.local` for settings persistence
- Storage key: `'laplace-settings'`
- Merge stored partial settings with `DEFAULT_SETTINGS` defaults

### API Clients
- OpenRouter: `src/lib/openrouter.ts` — chat completions with error handling
- GitHub API: `src/lib/github-api.ts` — fetch diff/commits with PAT support
- Always truncate large diffs to `MAX_DIFF_CHARS` (20000)

## File Structure

```
src/
├── background/index.ts       # Service worker entry
├── content/                  # Content script
│   ├── index.tsx            # Mount point
│   └── App.tsx              # Content UI
├── options/                  # Settings page
│   ├── index.html
│   └── Options.tsx
├── popup/                    # Extension popup
│   ├── index.html
│   └── Popup.tsx
├── lib/                      # Shared utilities
│   ├── types.ts             # All TypeScript types
│   ├── constants.ts         # Default settings, constants
│   ├── storage.ts           # chrome.storage wrappers
│   ├── openrouter.ts        # OpenRouter API client
│   ├── openrouter-models.ts # Model definitions
│   ├── github-api.ts        # GitHub API client
│   ├── dom-scraper.ts       # DOM extraction utilities
│   ├── context.ts           # Context validation/building
│   └── prompt.ts            # LLM prompt building
└── ui/                       # Reusable components
    ├── index.ts             # Barrel exports
    ├── Button.tsx
    ├── Input.tsx
    └── ...
```

## Development Workflow

1. Run `pnpm dev` for HMR development
2. Load extension in Chrome: `chrome://extensions/` → Developer mode → Load unpacked → Select `dist/`
3. Make changes — Vite rebuilds automatically
4. Run `pnpm lint && pnpm typecheck` before committing
5. Build with `pnpm build` for production

## Common Gotchas

- Content script only runs on `github.com/*/*/compare/*` URLs (see `manifest.json`)
- Background service worker is ephemeral — don't rely on global state
- GitHub API requires PAT for private repos (stored in settings)
- Diff is truncated at 20k chars to avoid token limits
- Options page opens in new tab (not popup) per manifest configuration
