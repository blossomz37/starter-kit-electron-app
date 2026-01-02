# Copilot Instructions for Electron App Starter Kit

## Project Architecture

This is an **Electron desktop application** with a split-process architecture:
- **Main process** ([src/main.ts](../src/main.ts)): Node.js-based Electron runtime (built with esbuild)
- **Renderer process** ([src/renderer.tsx](../src/renderer.tsx)): React UI (built with Vite)
- Security model: `nodeIntegration: false`, `contextIsolation: true` — renderer has NO Node.js access

## Build System

Three build steps run in sequence:
1. **Renderer**: `vite build` → outputs to `dist/` (HTML/CSS/JS bundles)
2. **Main**: `esbuild src/main.ts --bundle --platform=node --outfile=dist/main.js`
3. **Preload**: `esbuild src/preload.ts --bundle --platform=node --outfile=dist/preload.cjs --format=cjs`

**Critical**: Main process uses ES modules (`type: "module"` in package.json), requires `import.meta.url` for `__dirname` polyfill (see [src/main.ts](../src/main.ts) lines 5-6).

## Development Workflow

- `npm run start`: Full build + launch Electron (production-like test)
- `npm run dev`: Vite dev server only (for renderer hot-reload, but won't launch Electron window)
- DevTools auto-open when `NODE_ENV === 'development'` ([src/main.ts](../src/main.ts) line 20)

## UI Component System

Uses **shadcn/ui** with Tailwind CSS:
- Components: `@/components/ui/*` (import path alias via [tsconfig.json](../tsconfig.json) and [vite.config.ts](../vite.config.ts))
- Theme: Neutral with CSS variables ([src/index.css](../src/index.css))
- Add components: `npx shadcn@latest add <component>` (configured via [components.json](../components.json))
- Utility helper: `cn()` function in [src/lib/utils.ts](../src/lib/utils.ts) for merging Tailwind classes

## Code Conventions

- **Path imports**: Always use `@/` alias (e.g., `import { Button } from '@/components/ui/button'`)
- **React**: Modern `createRoot` API, no class components ([src/renderer.tsx](../src/renderer.tsx))
- **Styling**: Tailwind utilities only — avoid custom CSS outside [src/index.css](../src/index.css)
- **TypeScript**: Strict mode enabled, use `react-jsx` transform (no `React` import needed in TSX)

## Adding Features

**New UI components**: Add to `src/components/ui/` via shadcn CLI or manually following existing patterns
**New routes/views**: This is a single-page app — extend [src/app.tsx](../src/app.tsx) or add routing library
**IPC communication**: Implemented via `contextBridge` in `src/preload.ts` and `ipcMain.handle` in `src/main.ts`.
- Renderer stays sandboxed (`nodeIntegration: false`, `contextIsolation: true`).
- Add new capabilities by extending `window.electronAPI` in preload + adding matching IPC handlers in main.

## Key Files

- [src/main.ts](../src/main.ts): BrowserWindow config, app lifecycle
- [src/preload.ts](../src/preload.ts): Secure IPC bridge (contextBridge)
- [src/app.tsx](../src/app.tsx): Main React component tree
- [tests/openrouter-smoke.mjs](../tests/openrouter-smoke.mjs): OpenRouter smoke test (writes outputs to `tests/out/`)
- [vite.config.ts](../vite.config.ts): Base path `./ ` required for Electron file:// protocol
- [components.json](../components.json): shadcn/ui setup (baseColor: neutral, cssVariables: true)

## Educational Context

Created for Future Fiction Academy — optimized for authors/educators learning Electron + React patterns. Prioritize clarity and simplicity over advanced optimization.
