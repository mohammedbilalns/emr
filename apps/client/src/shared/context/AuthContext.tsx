import type { AuthUser, LoginBody, Role } from "@emr/shared";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { loginApi, logoutApi, refreshApi } from "../api/auth.api";
import { tokenManager } from "../api/token-manager";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextType {
	user: AuthUser | null;
	status: AuthStatus;
	isAuthenticated: boolean;
	isLoading: boolean;
	isSuperAdmin: boolean;
	isReceptionist: boolean;
	isDoctor: boolean;
	login: (credentials: LoginBody) => Promise<void>;
	logout: () => Promise<void>;
	hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [status, setStatus] = useState<AuthStatus>("loading");

	// Initial session restoration via refresh cookie
	useEffect(() => {
		let isMounted = true;

		async function restoreSession() {
			try {
				const data = await refreshApi();
				if (!isMounted) return;
				tokenManager.setToken(data.accessToken);
				setUser(data.user);
				setStatus("authenticated");
			} catch {
				if (!isMounted) return;
				tokenManager.clearToken();
				setUser(null);
				setStatus("unauthenticated");
			}
		}

		void restoreSession();

		const handleExpired = () => {
			tokenManager.clearToken();
			setUser(null);
			setStatus("unauthenticated");
		};

		window.addEventListener("emr:auth:expired", handleExpired);
		return () => {
			isMounted = false;
			window.removeEventListener("emr:auth:expired", handleExpired);
		};
	}, []);

	const login = useCallback(async (credentials: LoginBody) => {
		setStatus("loading");
		try {
			const data = await loginApi(credentials);
			tokenManager.setToken(data.accessToken);
			setUser(data.user);
			setStatus("authenticated");
		} catch (error) {
			tokenManager.clearToken();
			setUser(null);
			setStatus("unauthenticated");
			throw error;
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await logoutApi();
		} catch {
			// Best effort logout, clean up client state regardless
		} finally {
			tokenManager.clearToken();
			setUser(null);
			setStatus("unauthenticated");
		}
	}, []);

	const hasRole = useCallback(
		(roles: Role[]): boolean => {
			if (!user) return false;
			return roles.includes(user.role);
		},
		[user],
	);

	const isSuperAdmin = user?.role === "SUPER_ADMIN";
	const isReceptionist = user?.role === "RECEPTIONIST";
	const isDoctor = user?.role === "DOCTOR";
	const isAuthenticated = status === "authenticated" && user !== null;
	const isLoading = status === "loading";

	return (
		<AuthContext.Provider
			value={{
				user,
				status,
				isAuthenticated,
				isLoading,
				isSuperAdmin,
				isReceptionist,
				isDoctor,
				login,
				logout,
				hasRole,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
