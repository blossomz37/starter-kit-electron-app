import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Welcome to Electron App Starter Kit
            </h1>
            <p className="text-lg text-muted-foreground">
              This is a starter kit with Vite, TypeScript, React, Tailwind CSS, and shadcn/ui.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
              Tech Stack
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>Electron - Desktop application framework</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>Vite - Fast build tool and dev server</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>TypeScript - Type-safe development</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>React - UI framework with ReactDOM createRoot</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>Tailwind CSS - Utility-first CSS framework</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>shadcn/ui - Beautiful component library</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Button>Get Started</Button>
            <Button variant="secondary">Learn More</Button>
            <Button variant="outline">Documentation</Button>
            <Button variant="ghost">GitHub</Button>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground font-mono">
              You're running: {navigator.userAgent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


