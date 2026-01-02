# starter-kit-electron-app

This is a starter kit for an Electron app that uses Vite, TypeScript, React, Tailwind CSS, and shadcn/ui.

## Attribution

This starter kit is based on and inspired by the tutorial “Create Electron App” by Roman Ďurek, published on December 5, 2024.

## Original article:
https://dev.bwrd.eu/blogs/create-electron-app

The implementation in this repository adapts and extends the original instructions for instructional use within the Future Fiction Academy learning environment.

## Contributing

While this repository is primarily maintained for Future Fiction Academy members, community contributions are welcome.

If you’d like to contribute improvements, fixes, or extensions:
- Fork the repository
- Create a feature branch
- Submit a pull request with a clear description of your changes
- All contributions are reviewed to ensure they align with the educational goals and stability of the starter kit.

## Intended Audience
This project is especially well-suited for:
- Authors and educators exploring desktop tooling
- Indie developers learning Electron + React workflows
- Technologists experimenting with AI-assisted or creative software projects
- Students following Future Fiction Academy courses or workshops

## Features

This branch includes a minimal **Simple Chatbot** app built on the starter kit:
- **OpenRouter chat + image generation** - Send text prompts or request image outputs
- **Session-only API key** - Key is kept in memory (not written to disk)
- **Model picker** - Two curated models listed in `docs/`
- **Downloads**
	- Chat export as Markdown (includes image links)
	- Image downloads with timestamps in filenames

Note: The Markdown export links images by filename (it does not embed base64 data URLs).

The underlying starter kit includes:
- **Electron** - Desktop application framework with secure defaults (contextIsolation enabled, nodeIntegration disabled)
- **Vite** - Fast build tool and dev server with hot module replacement
- **TypeScript** - Strict type-safe development with path aliases (@/) and modern `react-jsx` transform
- **React** - UI framework with modern ReactDOM createRoot API
- **Tailwind CSS** - Utility-first CSS framework with neutral theme and CSS variables
- **shadcn/ui** - Beautiful, accessible component library
- **ES Modules** - Modern module system throughout (main process uses ESM)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
npm install
```

### Running the App
```bash
npm run start
```

This command will:
1. Build the renderer process with Vite
2. Build the main process with esbuild
3. Build the preload script with esbuild
4. Launch the Electron app

### Development

**Option 1: Full development with Electron (recommended)**
```bash
npm run start
```
This builds and launches the full Electron app. Make changes to the code, then run this command again to see updates.

**Option 2: Renderer development only**
```bash
npm run dev
```
This runs the Vite dev server with hot module replacement for fast UI iteration. However, it won't launch the Electron window—use this when you only need to work on the React UI.

### Build
```bash
npm run build
```

Build both main and renderer processes for production.

## Project Structure

```
├── docs/
│   ├── ABOUT_CHATGPT_5.2_CHAT.md
│   └── ABOUT_NANO_BANANA_PRO.md
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Secure bridge (contextBridge) for IPC
│   ├── renderer.tsx         # React app entry point
│   ├── app.tsx              # Main React component
│   ├── index.css            # Global styles with Tailwind directives
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx   # shadcn/ui Button component
│   └── lib/
│       └── utils.ts         # Utility functions (cn helper)
├── tests/
│   ├── openrouter-smoke.mjs  # Smoke test for both OpenRouter models
│   └── out/                  # Test outputs (ignored)
├── index.html               # HTML entry point with root div
├── vite.config.ts           # Vite configuration with @ alias
├── tsconfig.json            # TypeScript configuration (jsx: react-jsx, paths)
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── components.json          # shadcn/ui configuration
└── package.json             # Project dependencies and scripts
```

## Styling

The project uses Tailwind CSS with the Neutral theme and CSS variables. Colors and design tokens can be customized in `src/index.css`.

### Adding shadcn/ui Components

To add more shadcn/ui components, use the CLI:
```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## Path Aliases

The project is configured with path aliases for cleaner imports:
- `@/` maps to `./src/`

Example:
```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

## Architecture Notes

### Security Model
- **Context Isolation**: Enabled (renderer process is isolated from Node.js)
- **Node Integration**: Disabled (renderer cannot directly access Node.js APIs)
- **IPC**: Implemented via `contextBridge` for `openExternal` and `openRouterChat` (see `preload.ts` + `ipcMain.handle` in `main.ts`)

### Build System
This project uses a **multi-build system**:
1. **Renderer** (React UI): Built by Vite → `dist/` folder
2. **Main** (Electron): Built by esbuild → `dist/main.js`
3. **Preload** (IPC bridge): Built by esbuild → `dist/preload.cjs`

The main process uses ES modules (`"type": "module"` in package.json), requiring `import.meta.url` for `__dirname` polyfill.

### TypeScript Configuration
- Uses modern `react-jsx` transform (no need to import React in every file)
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Path aliases configured in both `tsconfig.json` and `vite.config.ts`

## AI-Assisted Development

This project includes comprehensive AI coding instructions in [`.github/copilot-instructions.md`](.github/copilot-instructions.md) to help GitHub Copilot and other AI assistants understand the codebase architecture and conventions.

## Health Checks

Verify code quality with:
```bash
# Type checking
npx tsc --noEmit

# Security audit
npm audit

# Build verification
npm run build
```

## OpenRouter Smoke Test

This repo includes a simple smoke test for both models used by the app.

1. Create a `.env` file in the repo root with one of:
	- `OPENROUTER_API_KEY=...`
	- `OPENROUTER_KEY=...`
	- `OPENROUTER_API_TOKEN=...`

2. Add the model IDs to test:
	- `TEXT_MODEL=...`
	- `IMAGE_MODEL=...`

	(Alternatively, you can use `OPENROUTER_TEXT_MODEL` and `OPENROUTER_IMAGE_MODEL`.)

3. Run:

```bash
node tests/openrouter-smoke.mjs
```

It writes a timestamped folder under `tests/out/` with JSON responses and any returned images.

If your text model uses web search (e.g. `:online`), the test also writes parsed URL citations to `text-web-citations.json`.

## License

This project is licensed under the MIT License.  
See the LICENSE file for details.

