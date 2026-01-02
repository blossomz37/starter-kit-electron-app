import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Load the index.html from the dist folder
  // (When bundled, `__dirname` points at `dist/` where `main.js` is.)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle(
  'openrouter-chat',
  async (
    _event,
    payload: {
      apiKey: string;
      body: unknown;
    }
  ) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payload.apiKey}`,
        'Content-Type': 'application/json',
        // Optional OpenRouter attribution headers.
        'X-Title': 'starter-kit-electron-app',
      },
      body: JSON.stringify(payload.body),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    return JSON.parse(text) as unknown;
  }
);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
