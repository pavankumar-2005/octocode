# Changelog

Newest first. One entry per change. See `docs/README.md` for the template.

### 2026-11-01: Connected to GitHub
- **What:** Linked the local repo to `https://github.com/pavankumar-2005/octocode` (remote `origin`, branch `main`) and merged the README-only commit that was created on GitHub. Kept the local `README.md` (setup + commands) and saved the GitHub README as `docs/project-overview.md`. Put the real clone URL in the README quick start.
- **Why:** The first push was rejected because GitHub already had a commit the local repo didn't know about (two unrelated histories).
- **Files:** `README.md`, `docs/project-overview.md` (new), `docs/README.md`, `docs/changelog.md`, `docs/how-octocode-works.md`, `docs/learning-path.md`
- **Test:** `git remote -v` shows `origin`; `git status` says "up to date with 'origin/main'"; open https://github.com/pavankumar-2005/octocode and see all folders.

### 2026-10-30: Plain-English project guide
- **What:** Added `docs/how-octocode-works.md`: every part of OctoCode explained simply (basics, client, server, database, runner, AI, Docker, CRDTs), step-by-step walkthroughs, problems we solved, code map, limits, glossary, and a build journal. Added the rule to keep it updated to `CLAUDE.md`.
- **Why:** The developer builds this alone and needs to understand every part.
- **Files:** `docs/how-octocode-works.md` (new), `CLAUDE.md`, `docs/README.md`, `README.md`, `docs/changelog.md`
- **Test:** open `docs/how-octocode-works.md` in VS Code and press `Cmd+Shift+V` for the preview.

### 2026-10-30: Java, C++ and C support
- **What:** Added a `runner` container (gcc, g++, OpenJDK 17) that compiles and runs Java, C++ and C, a `POST /api/run` server route that forwards to it, and the three languages in the room language picker with syntax highlighting and hello-world starter code for every language.
- **Why:** The platform must support more than Python and JavaScript. These languages can't run in the browser, so they need a server-side sandbox.
- **Files:** `runner/**` (new), `docker-compose.yml`, `server/src/routes/run.js` (new), `server/src/routes/rooms.js`, `server/src/index.js`, `client/src/lib/languages.ts` (new), `client/src/lib/runCode.ts`, `client/src/lib/api.ts`, `client/src/pages/Home.tsx`, `client/src/pages/Room.tsx`, `docs/*`, `README.md`, `BUILD_GUIDE.md`
- **Test:** `make up`, create a room for each of Java / C++ / C, press Run on the starter code. Try a compile error, and `int main(){ while(1){} }` (killed after 10 s). API check: `curl -X POST localhost:5050/api/run -H "Content-Type: application/json" -d '{"language":"c","code":"#include <stdio.h>\nint main(){puts(\"hi\");}"}'`

### 2026-10-30: Server published on port 5050, first real run
- **What:** Changed the server's host port from 5000 to 5050 (`"5050:5000"`) and the client URLs to `localhost:5050`. Ran the stack for the first time and tested it end to end.
- **Why:** On macOS, AirPlay Receiver (ControlCenter) already listens on port 5000, so `make up` failed with "address already in use". Changing the port keeps `make up` a one-command start with no manual steps.
- **Files:** `docker-compose.yml`, `client/src/lib/collab.ts`, `BUILD_GUIDE.md`, `docs/api.md`, `docs/architecture.md`, `docs/decisions.md`
- **Test:** `make up` → `curl http://localhost:5050/health` → `{"ok":true}`. Verified: rooms create/get/404, AI 400/502 errors, CORS header, two Yjs clients inserting at the same spot converge, text survives `make down && make up`, no "Yjs was already imported" warning in the logs.

### 2026-10-30: First end-to-end version (Blocks 1–8)
- **What:** Built the whole MVP from `BUILD_GUIDE.md`: Docker Compose (mongo, server, client), `Makefile`, `start.command`; Express server with rooms REST API, AI chat route (Ollama/Gemini) and y-websocket relay with MongoDB persistence; React + HeroUI client with landing page, room page, Monaco + Yjs live editing, named remote cursors, presence avatars, online/offline chip, Python/JS runners in Web Workers with a 10 s timeout, AI chat with "Explain selection", offline editing via IndexedDB, toasts and copy-link. Moved `README.md`, `BUILD_GUIDE.md`, `CLAUDE.md` to the repo root and `README (1).md` → `docs/README.md` to match the guide's layout.
- **Why:** Day 1 + Day 2 of the build plan in one pass, so `make up` gives a working demo.
- **Files:** `docker-compose.yml`, `Makefile`, `start.command`, `.env.example`, `.gitignore`, `server/**`, `client/**`, `docs/*`
- **Test:** `make up`, then `open http://localhost:5173`; `curl http://localhost:5050/health` → `{"ok":true}`; open the same room in a normal and a private window and type in both; run `print("hi")` and `while True: pass`; refresh, and `make down && make up` → text still there.

### 2026-10-29: Project docs and build guide
- **What:** Added `BUILD_GUIDE.md` (2-day plan, Docker Compose setup, code), rewrote `README.md`, added `CLAUDE.md` and the `docs/` folder
- **Why:** One-command start (`make up`), HeroUI frontend, macOS commands, and a learning-friendly plan
- **Files:** `README.md`, `BUILD_GUIDE.md`, `CLAUDE.md`, `docs/*`
- **Test:** open the files; after building, run `make up` and visit `http://localhost:5173`
