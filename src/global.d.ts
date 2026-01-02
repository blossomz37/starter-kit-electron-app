declare module '*.css';

interface Window {
	electronAPI?: {
		openExternal: (url: string) => Promise<void>;
	};
}
