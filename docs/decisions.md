# Technical Decisions

Short records of *why*. Add a new entry whenever you make a technical choice.

| # | Decision | Why | Trade-off |
| --- | --- | --- | --- |
| D1 | Use **Yjs (CRDT)** instead of Operational Transformation | No central transformation logic, works offline, mature ecosystem (`y-monaco`, `y-websocket`) | Doc history grows; need persistence and occasional compaction |
| D2 | Pin **`y-websocket@^2`** | Its server helper (`y-websocket/bin/utils`) is easy to embed in our Express server. Newer versions moved the server into a separate package | Stay on 2.x until we deliberately migrate |
| D3 | **One port** for REST and WebSocket (`/yjs/:room`) | Simpler Docker/CORS setup | The server handles both kinds of traffic |
| D4 | Run **Python and JS in the browser** (Pyodide, Web Workers) | No server sandbox to build, safe for the server, works offline-ish | Python only has Pyodide's packages; C++/Java need Piston (stretch) |
| D5 | **Guest users** (name + color), no passwords. *Partly replaced by D17 on 2026-11-01:* still true for quick sessions | Auth is not the point of this project; saves ~half a day | Anyone with the link can edit |
| D6 | **HeroUI (`@heroui/react`) + Tailwind v4** | Required UI library; documented setup for Vite | HeroUI v3 exists; we don't mix versions |
| D7 | **Docker Compose in dev mode** (bind mounts + hot reload) | One command starts everything and edits show up instantly | Not a production setup |
| D8 | **Ollama runs on the Mac**, not in Docker | Docker on Mac has no GPU access, so local models are slow in a container | Containers must use `host.docker.internal` |
| D9 | **MongoDB** stores rooms and Yjs state blobs | Fits the stack, flexible documents | Yjs state is opaque binary, not queryable text |
| D10 | Install **`monaco-editor`** locally and point `@monaco-editor/react` at it (`loader.config({ monaco })`) | `y-monaco` imports `monaco-editor` itself; editor and binding must share one Monaco copy for cursors to work | Bigger client bundle than the CDN default; Vite needs `?worker` imports for Monaco workers |
| D11 | Server loads `yjs` and `y-websocket/bin/utils` with `createRequire` (CommonJS) | `bin/utils` is CommonJS and `require`s yjs; an ESM `import "yjs"` would load a second Yjs copy ("Yjs was already imported") | One file (`server/src/yjs.js`) mixes `require` into an ESM project |
| D12 | Cache room info in `localStorage` | Lets a room page open while the server is unreachable (offline-first) | Cached name/language can be stale (they never change in the MVP) |
| D13 | Publish the server on **host port 5050** (container still uses 5000) | macOS AirPlay Receiver already uses port 5000, which breaks `make up` | URLs in docs differ from the container port; inside Docker it is still `:5000` |
| D14 | Own **runner container** (gcc, g++, OpenJDK 17 on Debian) for Java/C++/C instead of Piston | Piston's image is x86-only and needs `privileged: true`; on Apple Silicon it would run emulated. Ours is native arm64, unprivileged and ~100 lines | We maintain the sandbox ourselves; adding a language = editing `runner/src/run.js` and the Dockerfile |
| D15 | Lock the runner down with Docker: `internal` network, `read_only`, `tmpfs /tmp`, `mem_limit`, `cpus`, `pids_limit`, `cap_drop: ALL`, non-root user, 10 s kill | It executes untrusted code, so a bad program must not reach the internet, fill the disk, eat RAM or fork-bomb the machine | Container isolation is good for a demo, not as strong as gVisor/Firecracker for a public service |
| D16 | Only the room **creator** inserts starter code, after sync, if the doc is empty | If every joiner inserted it, two people opening a new room together would each add a copy (the CRDT keeps both) | A room created offline-then-joined could still start empty |
| D17 | **Accounts only for long-term projects**; quick sessions stay guest-only (24 h) | Two needs: instant rooms without sign-up, and private projects that last. Keeping guests for short work keeps the "share a link and go" demo | Two code paths for rooms; the original "no auth" scope is relaxed |
| D18 | **No new libraries for auth**: Node's built-in `crypto.scrypt` (salted hash) + random session tokens stored (hashed) in MongoDB | Keeps the original dependency list; `scrypt` is a strong password hash; DB sessions are easy to explain and to revoke (logout deletes the row) | We wrote ~60 lines ourselves instead of using bcrypt/JWT/Passport; one DB lookup per request |
| D19 | **TTL indexes** delete temporary rooms and their `yjs_docs` after 24 h | MongoDB does the cleanup itself; no cron job or timer code | Deletion runs about once a minute, so `findLiveRoom` also filters expired rooms |
| D20 | **Check room access on the WebSocket upgrade**, with the token in `?token=` | The code travels over the WebSocket, so REST-only checks would leave projects readable. Browsers can't set WebSocket headers | Tokens appear in server URLs (fine for local dev; use a short-lived ticket in production) |
| D21 | Theme = **`light`/`dark` class on `<html>`**, set by an inline script before first paint, saved in `localStorage` | HeroUI and Tailwind both key off that class; the early script prevents a white flash | A tiny bit of JS in `index.html` |
| D22 | Fix full-height layout by giving HeroUI's `[data-overlay-container]` wrapper `height: 100%` | That wrapper had no height, so `h-full` pages collapsed to their content (the "half screen" editor) | Relies on HeroUI's wrapper attribute name |

## Template

```md
| D? | Decision | Why | Trade-off |
```
