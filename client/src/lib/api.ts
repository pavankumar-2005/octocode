const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "octocode-token";

export type RoomKind = "temporary" | "project";
export type Room = {
  _id: string;
  name: string;
  language: string;
  kind?: RoomKind; // missing on rooms made before accounts existed (treated as temporary)
  createdAt: string;
  expiresAt?: string; // temporary rooms only
  ownerId?: string; // projects only
  members?: string[]; // projects only
};
export type Account = { _id: string; name: string; email: string };
type AuthResponse = { token: string; user: Account };

// The login token is kept in localStorage so you stay signed in after a refresh.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string | null) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

// Every request carries the token (if any); the server decides what it allows.
function headers(): Record<string, string> {
  const token = getToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const get = (path: string) => fetch(`${API}${path}`, { headers: headers() });
const post = (path: string, body: unknown) =>
  fetch(`${API}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });

// fetch() only rejects on network errors, so turn HTTP errors (404, 502...) into errors too.
async function json<T>(r: Response): Promise<T> {
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail ?? data.error ?? `HTTP ${r.status}`);
  return data;
}

export const register = (name: string, email: string, password: string) =>
  post("/api/auth/register", { name, email, password }).then((r) => json<AuthResponse>(r));

export const login = (email: string, password: string) =>
  post("/api/auth/login", { email, password }).then((r) => json<AuthResponse>(r));

export const getMe = () => get("/api/auth/me").then((r) => json<{ user: Account }>(r));

export const logout = () => post("/api/auth/logout", {});

export const createRoom = (name: string, language: string, kind: RoomKind = "temporary") =>
  post("/api/rooms", { name, language, kind }).then((r) => json<Room>(r));

export const getRoom = (id: string) => get(`/api/rooms/${id}`).then((r) => json<Room>(r));

export const listProjects = () => get("/api/rooms").then((r) => json<Room[]>(r));

export const askAi = (prompt: string, code: string, language: string) =>
  post("/api/ai/chat", { prompt, code, language }).then((r) => json<{ reply: string }>(r));

export const runOnServer = (language: string, code: string) =>
  post("/api/run", { language, code }).then((r) => json<{ ok: boolean; output: string }>(r));
