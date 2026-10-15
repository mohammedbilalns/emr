type TokenListener = (token: string | null) => void;

let inMemoryAccessToken: string | null = null;
const listeners = new Set<TokenListener>();

/**
 * In-memory manager for short-lived access tokens.
 * Storing tokens in memory instead of localStorage prevents persistent token theft via XSS.
 */
export const tokenManager = {
	getToken(): string | null {
		return inMemoryAccessToken;
	},

	setToken(token: string | null): void {
		inMemoryAccessToken = token;
		for (const listener of listeners) {
			listener(token);
		}
	},

	clearToken(): void {
		this.setToken(null);
	},

	subscribe(listener: TokenListener): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
};
