# API Reference

Base URL (local): `http://localhost:5050`

## REST

### `GET /health`
Returns `{ "ok": true }`. Use it to check the server is up.

### `POST /api/rooms`
Create a room.

```json
// request
{ "name": "DSA practice", "language": "python" }

// response 201
{ "_id": "a1B2c3D4", "name": "DSA practice", "language": "python", "createdAt": "2026-10-29T10:00:00.000Z" }
```

`language` is one of `"python"`, `"javascript"`, `"java"`, `"cpp"`, `"c"` (anything else becomes `"python"`). `name` defaults to `"Untitled room"`.

### `GET /api/rooms/:id`
Fetch a room. Returns the same shape as above, or `404 { "error": "room not found" }`.

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

- URL: `ws://localhost:5050/yjs/<roomId>`
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
