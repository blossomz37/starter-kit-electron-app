import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openRouterChat: (apiKey: string, body: unknown) =>
    ipcRenderer.invoke('openrouter-chat', { apiKey, body }),
});
