import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "./api";
import type { Account } from "./api";

type AuthValue = {
  account: Account | null; // null = not signed in
  ready: boolean; // false while we check a saved token with the server
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);
const ACCOUNT_KEY = "octocode-account";

function cachedAccount(): Account | null {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Show the cached account straight away (also works offline); the server check below confirms it.
  const [account, setAccount] = useState<Account | null>(() => (api.getToken() ? cachedAccount() : null));
  const [ready, setReady] = useState(!api.getToken());

  function remember(token: string, user: Account) {
    api.setToken(token);
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user));
    setAccount(user);
  }

  function forget() {
    api.setToken(null);
    localStorage.removeItem(ACCOUNT_KEY);
    setAccount(null);
  }

  // On page load, ask the server whether the saved token is still valid.
  useEffect(() => {
    if (!api.getToken()) return;
    api
      .getMe()
      .then(({ user }) => {
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user));
        setAccount(user);
      })
      .catch((err: Error) => {
        // Expired or signed out elsewhere → forget it. A network error (offline) keeps the cached account.
        if (err.message === "login required") forget();
      })
      .finally(() => setReady(true));
  }, []);

  const value: AuthValue = {
    account,
    ready,
    signIn: async (email, password) => {
      const { token, user } = await api.login(email, password);
      remember(token, user);
    },
    signUp: async (name, email, password) => {
      const { token, user } = await api.register(name, email, password);
      remember(token, user);
    },
    signOut: async () => {
      await api.logout().catch(() => {}); // even if the server is down, sign out locally
      forget();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
