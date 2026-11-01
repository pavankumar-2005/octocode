const API = import.meta.env.VITE_API_URL;

export type Room = { _id: string; name: string; language: string; createdAt: string };

// fetch() only rejects on network errors, so turn HTTP errors (404, 502...) into errors too.
async function json<T>(r: Response): Promise<T> {
  const data = await r.json();
  if (!r.ok) throw new Error(data.detail ?? data.error ?? `HTTP ${r.status}`);
  return data;
}

export const createRoom = (name: string, language: string) =>
  fetch(`${API}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, language }),
  }).then((r) => json<Room>(r));

export const getRoom = (id: string) => fetch(`${API}/api/rooms/${id}`).then((r) => json<Room>(r));

export const askAi = (prompt: string, code: string, language: string) =>
  fetch(`${API}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, code, language }),
  }).then((r) => json<{ reply: string }>(r));

export const runOnServer = (language: string, code: string) =>
  fetch(`${API}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  }).then((r) => json<{ ok: boolean; output: string }>(r));
