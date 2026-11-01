# API Reference

Base URL (local): `http://localhost:5050`

## REST

### `GET /health`
Returns `{ "ok": true }`. Use it to check the server is up.

### Authentication

Signed-in requests send `Authorization: Bearer <token>`. Any request without a valid token is treated as a guest. Tokens last 7 days.

#### `POST /api/auth/register`
```json
// request
{ "name": "Pavan", "email": "pavan@example.com", "password": "at-least-8" }

// response 201
{ "token": "64 hex chars", "user": { "_id": "I5Ksd22M_-0P", "name": "Pavan", "email": "pavan@example.com" } }
```
Errors: `400 { "error": "name required" | "valid email required" | "password must be at least 8 characters" }`, `409 { "error": "email already registered" }`. The email is stored lower-case.

#### `POST /api/auth/login`
Request `{ "email", "password" }` → `200` with the same shape as register. Error: `401 { "error": "wrong email or password" }` (same message for an unknown email).

#### `GET /api/auth/me`
→ `200 { "user": { "_id", "name", "email" } }`, or `401 { "error": "login required" }`.

#### `POST /api/auth/logout`
Deletes the current token's session → `204` (no body). Needs a valid token (`401` otherwise).

### Rooms

There are two kinds of rooms:

| `kind` | Who can create | Who can open | Lifetime |
| --- | --- | --- | --- |
| `"temporary"` (default) | anyone | anyone with the link | 24 h, then deleted (room + code) |
| `"project"` | signed-in users | signed-in users with the link; opening it adds you to `members` | until deleted |

Rooms created before 2026-11-01 have no `kind` and no `expiresAt`. They behave like temporary rooms that never expire.

#### `POST /api/rooms`
```json
// request
{ "name": "DSA practice", "language": "python", "kind": "temporary" }

// response 201 (temporary)
{ "_id": "a1B2c3D4", "name": "DSA practice", "language": "python", "kind": "temporary",
  "createdAt": "2026-11-01T10:00:00.000Z", "expiresAt": "2026-11-02T10:00:00.000Z" }

// response 201 (project)
{ "_id": "nREUeAGL", "name": "My API", "language": "java", "kind": "project",
  "createdAt": "…", "ownerId": "I5Ksd22M_-0P", "members": ["I5Ksd22M_-0P"] }
```

`language` is one of `"python"`, `"javascript"`, `"java"`, `"cpp"`, `"c"` (anything else becomes `"python"`). `name` defaults to `"Untitled room"`. Any `kind` other than `"project"` becomes `"temporary"`. Error: `401 { "error": "login required" }` for a project without a token.

#### `GET /api/rooms/:id`
Fetch a room. Returns the same shape as above. Errors: `404 { "error": "room not found" }` (also for expired rooms), `401 { "error": "login required" }` for a project without a valid token.

#### `GET /api/rooms`
Your projects (every project where you are in `members`), newest first. Requires a token (`401` otherwise).

### `POST /api/ai/chat`
Ask the AI assistant about the current code.

```json
// request
{ "prompt": "Explain this function", "code": "def f(x): return x*2", "language": "python" }

// response 200
{ "reply": "..." }
```

Errors: `400 { "error": "prompt required" }`, `502 { "error": "AI provider unreachable", "detail": "..." }` (also returned when the provider answers with an HTTP error, e.g. a bad Gemini key or a missing Ollama model).

### `POST /api/run`
Compile and run Java, C++ or C in the sandboxed runner container. (Python and JavaScript run in the browser and don't use this.)

```json
// request
{ "language": "cpp", "code": "#include <iostream>\nint main(){ std::cout << 42; }" }

// response 200 (also 200 for compile errors, crashes and timeouts, with ok: false)
{ "ok": true, "output": "42" }
{ "ok": false, "output": "Compilation failed:\nmain.c:1:24: error: ..." }
{ "ok": false, "output": "Timed out after 10 s" }
```

Errors: `400 { "error": "unsupported language" }`, `400 { "error": "code required" }`, `502 { "error": "code runner unreachable", "detail": "..." }`.

Limits: compile 15 s, run 10 s, output 64 KB, no stdin, no internet. Java: the file is named after the `public class` (default `Main`).

## WebSocket (Yjs sync)

- URL: `ws://localhost:5050/yjs/<roomId>?token=<token>` (`token` is optional for temporary rooms)
- Access check before the upgrade: the connection is closed for an unknown or expired room, and for a project unless the token is valid and its user is in `members`. Browsers can't set headers on a WebSocket, so the token goes in the query string.
- Protocol: the standard `y-websocket` protocol (binary messages: sync + awareness). Don't send JSON; use `WebsocketProvider` on the client.
- Shared type: `Y.Text` named `"code"`.
- Awareness state per user: `{ user: { name, color } }`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `CLIENT_ORIGIN` | Allowed CORS origin |
| `MONGODB_URI` | Set by `docker-compose.yml` |
| `AI_PROVIDER` | `ollama` or `gemini` |
| `OLLAMA_URL`, `OLLAMA_MODEL` | Local AI settings |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini settings |
| `VITE_API_URL`, `VITE_WS_URL` | Client → server URLs (set in compose) |
| `RUNNER_URL` | Server → runner URL, `http://runner:7000` (set in compose) |
