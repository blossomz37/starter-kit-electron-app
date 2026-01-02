declare module '*.css';

interface Window {
	electronAPI?: {
		openExternal: (url: string) => Promise<void>;
		openRouterChat: (apiKey: string, body: unknown) => Promise<unknown>;
	};
}
