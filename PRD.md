# Laplace - Product Requirements Document

> Auto-generate GitHub PR descriptions using AI (Chrome/Edge + VS Code)

---

## Overview

Chrome/Edge browser extension and VS Code extension that automatically generate pull request descriptions using AI. Users bring their own OpenRouter API key (BYOK). Both extensions share a common core library (`@laplace/shared`).

---

## Goals

- **One-click PR descriptions** — Generate meaningful PR descriptions instantly
- **BYOK model** — User controls their AI costs via OpenRouter
- **No backend** — Direct API calls, no server to maintain
- **Privacy first** — Keys stored locally, never transmitted to third parties

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Language | TypeScript |
| Chrome Extension | React 18 + Tailwind CSS + Vite + `@crxjs/vite-plugin` |
| VS Code Extension | esbuild + VS Code Extension API |
| AI Provider | OpenRouter (direct REST API) |
| Chrome Storage | `chrome.storage.local` |
| VS Code Storage | `vscode.workspace.getConfiguration` |

### Package Structure

| Package | Name | Purpose |
|---------|------|---------|
| `packages/shared` | `@laplace/shared` | Types, API clients, prompts (shared logic) |
| `packages/chrome-ext` | `@laplace/chrome-ext` | Chrome/Edge Manifest v3 extension |
| `packages/vscode-ext` | `@laplace/vscode-ext` | VS Code extension |
| `landing-page` | — | Next.js marketing site |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Browser Extension                          │
│                                                                  │
│  ┌──────────────┐    message    ┌────────────────────────────┐  │
│  │Content Script│◀────────────▶│   Background Service Worker │  │
│  │  (React UI)  │               │                            │  │
│  └──────┬───────┘               │  ┌────────────────────────┐│  │
│         │                       │  │   Hybrid Fetching      ││  │
│         ▼                       │  │                        ││  │
│  ┌──────────────┐               │  │  DOM ──▶ title,        ││  │
│  │GitHub PR Page│               │  │          branches,     ││  │
│  │              │               │  │          labels        ││  │
│  │ • Toast hint │               │  │                        ││  │
│  │ • Alt+G      │               │  │  API ──▶ diff,         ││  │
│  │   shortcut   │               │  │          commits       ││  │
│  │ • Preview    │               │  └───────────┬────────────┘│  │
│  │   modal      │               │              │              │  │
│  └──────────────┘               │              ▼              │  │
│                                 │  ┌────────────────────────┐│  │
│                                 │  │   OpenRouter API       ││  │
│                                 │  │   (direct fetch)       ││  │
│                                 │  └────────────────────────┘│  │
│                                 └────────────────────────────┘  │
│                                              │                   │
│                                              ▼                   │
│                                 ┌────────────────────────────┐  │
│                                 │  chrome.storage.local      │  │
│                                 │  • OpenRouter API key      │  │
│                                 │  • Selected model          │  │
│                                 │  • GitHub PAT (optional)   │  │
│                                 │  • Style preference        │  │
│                                 │  • Custom prompt           │  │
│                                 └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## UX Flow (v2 - Toast + Keyboard)

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub PR Page                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  PR Title: [Add user authentication]                        ││
│  │  base: main ← compare: feature/auth                         ││
│  │                                                             ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ Description textarea                                │   ││
│  │  │                                                     │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                           ┌──────────────────────────────────┐  │
│                           │ ✨ Laplace detected a PR         │  │
│                           │    Press Alt+G to generate       │  │
│                           └──────────────────────────────────┘  │
│                                    ▲                             │
│                                    │ Toast (auto-dismiss 5s)     │
└─────────────────────────────────────────────────────────────────┘
```

**Why Toast + Shortcut (not button injection):**
- No DOM injection issues (toast is our own floating element)
- Never breaks when GitHub updates their UI
- Simpler, more reliable code
- Less intrusive UX

---

## Hybrid Context Fetching

| Data | Source | Reason |
|------|--------|--------|
| Title | DOM | Stable selector, always visible |
| Branches (base/head) | DOM | Stable selector |
| Labels | DOM | Stable selector |
| Existing description | DOM | Already in textarea |
| Diff content | GitHub API | Structured, complete, reliable |
| Commit messages | GitHub API | Clean JSON, not truncated |

---

## File Structure

```
laplace/
├── manifest.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── tsconfig.json
├── AGENTS.md
├── PRD.md                        # This file (gitignored)
├── .gitignore
│
├── src/
│   ├── content/
│   │   ├── index.tsx              # Entry point, mounts React
│   │   ├── App.tsx                # Main UI (toast, modal, keyboard handler)
│   │   └── styles.css             # Tailwind imports
│   │
│   ├── background/
│   │   └── index.ts               # Service worker orchestration
│   │
│   ├── options/
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Options.tsx            # Settings UI
│   │
│   ├── popup/
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Popup.tsx              # Quick status popup
│   │
│   ├── lib/
│   │   ├── constants.ts           # Models, defaults, API URLs
│   │   ├── context.ts             # Orchestrates hybrid fetching
│   │   ├── dom-scraper.ts         # Scrape title, branches, labels
│   │   ├── github-api.ts          # Fetch diff, commits
│   │   ├── openrouter.ts          # Direct API call
│   │   ├── openrouter-models.ts   # Fetch model catalog
│   │   ├── prompt.ts              # Build prompt from context
│   │   ├── storage.ts             # chrome.storage wrapper
│   │   └── types.ts               # TypeScript interfaces
│   │
│   └── ui/
│       └── (shared components)
│
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── dist/                          # Build output (gitignored)
```

---

## Features

### Core Features (MVP) ✅

- [x] BYOK with OpenRouter API key
- [x] Model selection (popular + searchable catalog)
- [x] Hybrid context fetching (DOM + GitHub API)
- [x] Generate with keyboard shortcut (Alt+G)
- [x] Preview before inserting
- [x] Style options (Short / Medium / Detailed)

### v2 Features ✅

- [x] GitHub PAT for private repos / rate limits
- [x] DOM fallback for private repos (when no PAT)
- [x] Flexible model selection (popular + OpenRouter catalog search)
- [x] Generate PR title option
- [x] Custom prompts
- [x] Auto-insert preference

### Planned Features

- [ ] New design system + logo
- [ ] Deploy landing page
- [ ] VS Code extension (Phase 13)

### Future (v3+)

- [ ] Streaming responses
- [ ] OpenAI / Claude direct API support
- [ ] PR template support
- [ ] Firefox support
- [ ] PR comment generation
- [ ] VS Code extension: Webview settings UI
- [ ] VS Code extension: Status bar integration

---

## Settings

| Setting | Type | Required | Default |
|---------|------|----------|---------|
| OpenRouter API Key | password | ✅ | — |
| Model | dropdown | ✅ | `openai/gpt-oss-120b:free` |
| GitHub PAT | password | ❌ | — |
| Description Style | radio | ✅ | Medium |
| Generate Title | toggle | ❌ | Off |
| Auto-insert | toggle | ❌ | On |
| Custom Prompt | textarea | ❌ | — |

---

## Supported Models (via OpenRouter)

### Popular Models (Quick Select)

| Model | ID | Notes |
|-------|----|-------|
| GPT-OSS 120B | `openai/gpt-oss-120b:free` | Default, free |
| Qwen3 Coder | `qwen/qwen3-coder:free` | Free, good for code |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct:free` | Free, open source |
| Devstral | `mistralai/devstral-2512:free` | Free, code-focused |
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | Best quality (paid) |

### Extended Selection
- "More models..." option opens searchable OpenRouter catalog
- Fetches live model list from OpenRouter API
- Search by name, filter by capabilities

---

## Data Flow

```
1. User opens GitHub PR page
              │
              ▼
2. Content script detects PR page
              │
              ▼
3. Toast appears: "Press Alt+G to generate"
              │
              ▼
4. User presses Alt+G
              │
              ▼
5. Content script sends message to background
              │
              ▼
6. Background orchestrates:
   ├── Scrape DOM → title, branches, labels
   ├── Call GitHub API → diff, commits (or DOM fallback)
   ├── Get settings → API key, model, style, custom prompt
   └── Build prompt
              │
              ▼
7. Background calls OpenRouter API
              │
              ▼
8. Background returns response to content script
              │
              ▼
9. Content script shows preview modal
              │
              ▼
10. User clicks "Insert" → fills textarea
    (or auto-inserts if preference enabled)
```

---

## Permissions

```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://github.com/*",
    "https://api.github.com/*",
    "https://openrouter.ai/*"
  ]
}
```

---

## Security

| Concern | Mitigation |
|---------|------------|
| API keys | Stored in `chrome.storage.local` only (never synced) |
| Transmission | HTTPS only, keys in request body |
| GitHub PAT | Optional, stored locally, never logged |
| Permissions | Minimal: only required domains |
| No backend | Keys go directly to OpenRouter, not through our servers |

---

## Development

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dist/ folder
```

---

## Phases & Tasks

### Phase 1-6: Foundation → MVP ✅
> All 18 tasks complete

- [x] Project setup, storage, types
- [x] Options page, popup
- [x] DOM scraper, GitHub API, context orchestrator
- [x] Prompt builder, OpenRouter API
- [x] Content script UI, generate button, preview
- [x] Error handling, testing, polish

---

### Phase 7: DOM Fallback & Error UX ✅

| # | Task | Status |
|---|------|--------|
| 7.1 | Scrape commits/files from DOM when API fails | ✅ DONE |
| 7.2 | Show toast notification with PAT docs link | ✅ DONE |
| 7.3 | Add "auto-inject" preference toggle | ✅ DONE |

---

### Phase 8: Flexible Model Selection ✅

| # | Task | Status |
|---|------|--------|
| 8.1 | Define 5 popular models (free + paid) | ✅ DONE |
| 8.2 | Add "More models..." option with divider | ✅ DONE |
| 8.3 | Fetch OpenRouter model list + searchable UI | ✅ DONE |

---

### Phase 9: Custom Prompts & Title Generation ✅

| # | Task | Status |
|---|------|--------|
| 9.1 | Add custom prompt editor in Options page | ✅ DONE |
| 9.2 | Add "Generate PR title" preference toggle | ✅ DONE |

---

### Phase 10: Toast + Keyboard UX ✅
> Replace button injection with toast hint + keyboard shortcut

| # | Task | Status |
|---|------|--------|
| 10.1 | Remove button injection logic (delete injection-manager.ts) | ✅ DONE |
| 10.2 | Add keyboard shortcut handler (Alt+G) | ✅ DONE |
| 10.3 | Add "PR detected" toast hint (auto-dismiss 5s) | ✅ DONE |
| 10.4 | Simplify App.tsx (remove portal, direct render) | ✅ DONE |
| 10.5 | Handle SPA navigation (re-show toast on new PR) | ✅ DONE |

---

### Phase 11: Design System & Branding ✅
> New visual identity

| # | Task | Status |
|---|------|--------|
| 11.1 | Implement new design system (dark theme, OKLCH tokens) | ✅ DONE |
| 11.2 | Create/integrate new logo (icon16/48/128) | ✅ DONE |
| 11.3 | Update all UI components to match design | ✅ DONE |
| 11.4 | Add Geist Mono font | ✅ DONE |

---

### Phase 12: Landing Page & Distribution
> Marketing site and publishing

| # | Task | Status |
|---|------|--------|
| 12.1 | Create `/landing-page` folder with Next.js setup | ✅ DONE |
| 12.2 | Build landing page (features, install guide, screenshots) | ✅ DONE |
| 12.3 | Deploy to GitHub Pages or Vercel | ⬜ TODO |
| 12.4 | Prepare Chrome Web Store assets | ⬜ TODO |
| 12.5 | Create v0.1.0-beta GitHub release | ✅ DONE |

---

### Phase 13: Monorepo & VS Code Extension
> Restructure into monorepo + scaffold VS Code extension

| # | Task | Status |
|---|------|--------|
| 13.1 | Restructure into npm workspaces monorepo (`packages/shared`, `packages/chrome-ext`, `packages/vscode-ext`) | ✅ DONE |
| 13.2 | Extract shared logic into `@laplace/shared` (types, API clients, prompts) | ✅ DONE |
| 13.3 | Migrate Chrome extension to `packages/chrome-ext/` | ✅ DONE |
| 13.4 | Scaffold VS Code extension (`packages/vscode-ext/`) with esbuild | ✅ DONE |
| 13.5 | VS Code extension: Command handler + context building via Git API | 🔄 Scaffolded |
| 13.6 | VS Code extension: Settings via VS Code configuration | ✅ DONE |
| 13.7 | VS Code extension: Publish to VS Code Marketplace | ⬜ TODO |
| 13.8 | Update AGENTS.md and PRD.md for monorepo structure | ✅ DONE |

---

## Checklist Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1-6 | Foundation → MVP | ✅ Complete (18 tasks) |
| 7 | DOM Fallback & Error UX | ✅ Complete (3 tasks) |
| 8 | Flexible Model Selection | ✅ Complete (3 tasks) |
| 9 | Custom Prompts & Title | ✅ Complete (2 tasks) |
| 10 | Toast + Keyboard UX | ✅ Complete (5 tasks) |
| 11 | Design System & Branding | ⬜ Planned (3 tasks) |
| 12 | Landing Page & Distribution | 🔄 In Progress (2/4 tasks) |
| 13 | Monorepo & VS Code Extension | 🔄 In Progress (6/8 tasks) |

**Total: 13 phases, 46 tasks — 39 complete, 7 remaining**

---

## Technical Notes

### Storage Persistence

**Chrome Extension:**
All settings are stored in `chrome.storage.local` which persists across:
- Browser restarts
- System shutdowns
- Extension updates

Settings are **not** synced across devices (intentional for security - API keys stay local).

**VS Code Extension:**
All settings are stored in VS Code's `settings.json` via `vscode.workspace.getConfiguration('laplace')`.

### Distribution Options

| Method | Cost | Pros | Cons |
|--------|------|------|------|
| Chrome Web Store | $5 one-time | Official, auto-updates, trusted | Review process |
| GitHub Releases | Free | No review, full control | Manual install |

**Recommendation**: Start with GitHub Releases for beta, then Chrome Web Store for stable.

---

## Changelog

### v2.1 (In Progress)
- **Phase 10**: New UX with toast hint + Alt+G keyboard shortcut
- Removed fragile button injection in favor of floating toast

### v2.0
- **Phase 7**: DOM fallback for private repos, toast notifications
- **Phase 8**: Flexible model selection with OpenRouter catalog
- **Phase 9**: Custom prompts, PR title generation
- Updated to free models by default (GPT-OSS 120B)

### v1.0
- Initial MVP with all core features
- Button injection into GitHub PR pages
- Preview modal with insert functionality
