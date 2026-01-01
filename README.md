# starter-kit-electron-app

This is a starter kit for an Electron app that uses Vite, TypeScript, React, Tailwind CSS, and shadcn/ui.

## Features

The starter kit includes:
- **Electron** - Desktop application framework
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development with path aliases (@/)
- **React** - UI framework with ReactDOM createRoot
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library

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
│   ├── main.ts              # Electron main process
│   ├── renderer.tsx         # React app entry point
│   ├── app.tsx              # Main React component
│   ├── index.css            # Global styles with Tailwind directives
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx   # shadcn/ui Button component
│   └── lib/
│       └── utils.ts         # Utility functions (cn helper)
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



