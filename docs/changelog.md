# Changelog

Newest first. One entry per change: what, why, files, how to test.

### 2026-11-01: Full-screen editor, light/dark theme, quick sessions vs long-term projects, accounts
- **What:**
  - **Full-screen room:** fixed the bug where the editor filled only part of the screen (HeroUI's wrapper div had no height). New layout: header (name, room type, status, avatars, theme, Copy link, Run), editor with a file tab, AI + output panels, status bar. Panels stack on phones.
  - **Light/dark theme:** a toggle on every page, saved in `localStorage`, defaults to the OS setting, no flash on load. Brand colors in `hero.ts` and matching Monaco themes.
  - **New landing page** with two modes: *Quick session* (no account, room + code auto-deleted after 24 h) and *Long-term project* (sign-in required, kept).
  - **Accounts:** register / sign in / sign out, stored in MongoDB (`users`, `sessions`). Passwords are hashed with `scrypt` + salt. New `/login` page with `?next=` redirect and a `/projects` dashboard (list, create, open a teammate's project by link).
  - **Access rules on the server:** project REST calls and the Yjs WebSocket both require a signed-in member. Opening a project link while signed in adds you to `members`.
  - Restyled AI chat (suggestion buttons, chat bubbles) and Output panel (terminal look, success/error chip).
- **Why:** the UI looked plain and the editor didn't use the full screen. Short work (an interview, a lab) and long work (a semester project) need different rooms, and long-lived projects should be private to signed-in members.
- **Files:** `server/src/auth.js` (new), `server/src/routes/auth.js` (new), `server/src/routes/rooms.js`, `server/src/index.js`, `server/src/db.js`, `server/src/yjs.js`, `client/index.html`, `client/src/main.tsx`, `client/src/hero.ts`, `client/src/index.css`, `client/src/lib/{api.ts,auth.tsx (new),theme.tsx (new),user.ts,collab.ts,monaco.ts,languages.ts}`, `client/src/pages/{Home.tsx,Room.tsx,Login.tsx (new),Projects.tsx (new)}`, `client/src/components/{AiChat.tsx,OutputPanel.tsx,CodeEditor.tsx,TopNav.tsx (new),ThemeToggle.tsx (new),Logo.tsx (new),Backdrop.tsx (new),Icons.tsx (new)}`, `docs/*`, `README.md`
- **Test:** `make up`, open http://localhost:5173. (1) Toggle the sun/moon button; refresh: the theme stays. (2) Start a quick session: the room fills the screen and shows "Temporary · 23h left". (3) Create an account, create a project, copy its link. (4) In a private window open the link: you land on sign-in; sign in with a second account and you're brought back into the project, which now appears on that account's dashboard. API: `curl -s -X POST localhost:5050/api/rooms -H "Content-Type: application/json" -d '{"kind":"project"}'` → `{"error":"login required"}`.

### 2026-11-01: Connected to GitHub
- **What:** Linked the local repo to `https://github.com/pavankumar-2005/octocode` (remote `origin`, branch `main`) and pushed it. Put the real clone URL in the README quick start.
- **Why:** An online copy is a backup, makes the project easy to share, and lets it be cloned on another machine.
- **Files:** `README.md`, `docs/changelog.md`
- **Test:** `git remote -v` shows `origin`; `git status` says "up to date with 'origin/main'"; open https://github.com/pavankumar-2005/octocode and see all folders.

### 2026-10-30: Java, C++ and C support
- **What:** Added a `runner` container (gcc, g++, OpenJDK 17) that compiles and runs Java, C++ and C, a `POST /api/run` server route that forwards to it, and the three languages in the room language picker with syntax highlighting and hello-world starter code for every language.
- **Why:** The platform must support more than Python and JavaScript. These languages can't run in the browser, so they need a server-side sandbox.
- **Files:** `runner/**` (new), `docker-compose.yml`, `server/src/routes/run.js` (new), `server/src/routes/rooms.js`, `server/src/index.js`, `client/src/lib/languages.ts` (new), `client/src/lib/runCode.ts`, `client/src/lib/api.ts`, `client/src/pages/Home.tsx`, `client/src/pages/Room.tsx`, `docs/*`, `README.md`
- **Test:** `make up`, create a room for each of Java / C++ / C, press Run on the starter code. Try a compile error, and `int main(){ while(1){} }` (killed after 10 s). API check: `curl -X POST localhost:5050/api/run -H "Content-Type: application/json" -d '{"language":"c","code":"#include <stdio.h>\nint main(){puts(\"hi\");}"}'`

### 2026-10-30: Server published on port 5050, first real run
- **What:** Changed the server's host port from 5000 to 5050 (`"5050:5000"`) and the client URLs to `localhost:5050`. Ran the stack for the first time and tested it end to end.
- **Why:** On macOS, AirPlay Receiver (ControlCenter) already listens on port 5000, so `make up` failed with "address already in use". Changing the port keeps `make up` a one-command start with no manual steps.
- **Files:** `docker-compose.yml`, `client/src/lib/collab.ts`, `docs/api.md`, `docs/architecture.md`, `docs/decisions.md`
- **Test:** `make up` → `curl http://localhost:5050/health` → `{"ok":true}`. Verified: rooms create/get/404, AI 400/502 errors, CORS header, two Yjs clients inserting at the same spot converge, text survives `make down && make up`, no "Yjs was already imported" warning in the logs.

### 2026-10-30: First end-to-end version (Blocks 1–8)
- **What:** Built the whole MVP: Docker Compose (mongo, server, client), `Makefile`, `start.command`; Express server with rooms REST API, AI chat route (Ollama/Gemini) and y-websocket relay with MongoDB persistence; React + HeroUI client with landing page, room page, Monaco + Yjs live editing, named remote cursors, presence avatars, online/offline chip, Python/JS runners in Web Workers with a 10 s timeout, AI chat with "Explain selection", offline editing via IndexedDB, toasts and copy-link.
- **Why:** Day 1 + Day 2 of the plan in one pass, so `make up` gives a working demo.
- **Files:** `docker-compose.yml`, `Makefile`, `start.command`, `.env.example`, `.gitignore`, `server/**`, `client/**`, `docs/*`
- **Test:** `make up`, then `open http://localhost:5173`; `curl http://localhost:5050/health` → `{"ok":true}`; open the same room in a normal and a private window and type in both; run `print("hi")` and `while True: pass`; refresh, and `make down && make up` → text still there.

### 2026-10-29: Project plan and docs
- **What:** Planned the 2-day build (scope, stack, Docker Compose setup), rewrote `README.md`, added the `docs/` folder
- **Why:** One-command start (`make up`), HeroUI frontend, macOS commands, and a small, clear scope
- **Files:** `README.md`, `docs/*`
- **Test:** open the files; after building, run `make up` and visit `http://localhost:5173`
