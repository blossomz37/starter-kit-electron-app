declare module '*.css';

declare global {
	interface Window {
		electronAPI?: {
			openExternal: (url: string) => Promise<void>;
		};
	}
}

export {};
