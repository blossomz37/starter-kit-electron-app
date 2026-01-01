# starter-kit-electron-app

This is a starter kit for an Electron app that uses Vite, TypeScript, React, Tailwind, and Shadcn UI.

## Phase 1: Setup Complete ✅

The starter kit now includes:
- **Electron** - Desktop application framework
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **React** - UI framework with ReactDOM createRoot

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
3. Launch the Electron app

### Development
```bash
npm run dev
```

Run Vite dev server for the renderer process.

### Build
```bash
npm run build
```

Build both main and renderer processes for production.

## Project Structure

```
├── src/
│   ├── main.ts       # Electron main process
│   ├── renderer.tsx  # React app entry point
│   └── app.tsx       # Main React component
├── index.html        # HTML entry point with root div
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration (jsx: react-jsx)
└── package.json      # Project dependencies and scripts
```

## Next Steps (Phase 2)
- Add Tailwind CSS
- Add Shadcn UI components
- Enhance UI/UX

