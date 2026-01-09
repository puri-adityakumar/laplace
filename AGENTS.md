# AGENTS.md - PR Bot

> Chrome/Edge extension for auto-generating GitHub PR descriptions using AI (OpenRouter BYOK)

## Build/Test Commands
- Install: `pnpm install`
- Dev: `pnpm dev` (Vite watch mode)
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`

## Architecture
- **Manifest v3** Chrome extension with React + Tailwind
- **src/content/** — Content script injected into GitHub PR pages
- **src/background/** — Service worker for API orchestration
- **src/options/** — Settings page (API key, model selection)
- **src/popup/** — Quick status popup
- **src/lib/** — Shared utilities (storage, API calls, DOM scraping)
- **src/ui/** — Reusable UI components

## Key Design Decisions
- **BYOK**: User provides OpenRouter API key (stored in chrome.storage.local)
- **Hybrid fetching**: DOM for title/branches/labels, GitHub API for diff/commits
- **No backend**: Direct API calls to OpenRouter and GitHub
- **See PRD.md** for full plan and task phases (gitignored, local only)

## Code Style
- TypeScript with strict mode
- Named exports over default exports
- async/await over raw Promises
- Explicit error handling; no silent catches
- Small, focused functions
- Descriptive variable names (no abbreviations)
