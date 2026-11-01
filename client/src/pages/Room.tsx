import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { addToast, Avatar, AvatarGroup, Button, Card, CardBody, Chip, Input, Spinner, Tooltip } from "@heroui/react";
import type { editor } from "monaco-editor";
import CodeEditor from "../components/CodeEditor";
import OutputPanel from "../components/OutputPanel";
import AiChat from "../components/AiChat";
import StatusChip from "../components/StatusChip";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { ClockIcon, FolderIcon, LinkIcon, PlayIcon } from "../components/Icons";
import { getRoom, getToken, MAX_TEAM, type Room as RoomInfo } from "../lib/api";
import { useAuth } from "../lib/auth";
import { createCollab, destroyCollab, type Collab, type User } from "../lib/collab";
import { getLanguage } from "../lib/languages";
import { runForLanguage, type RunResult } from "../lib/runCode";
import { getColor, loadUser, saveName } from "../lib/user";

type Peer = { clientId: number; name: string; color: string };

export default function Room() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { account, ready } = useAuth();
  const fresh = Boolean((location.state as { fresh?: boolean } | null)?.fresh);
  const [guest, setGuest] = useState<User | null>(loadUser);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [full, setFull] = useState<"room" | "project" | null>(null);
  const [collab, setCollab] = useState<Collab | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const isProject = room?.kind === "project";

  // Who am I in this room? Projects use your account name; quick sessions use a guest name.
  // useMemo keeps the same object between renders, so the collab effect below doesn't reconnect.
  const user = useMemo<User | null>(() => {
    if (!room) return null;
    if (isProject) return account ? { name: account.name, color: getColor() } : null;
    return guest;
  }, [room, isProject, account?.name, guest]);

  // 1. Load room info (name, language, kind). Wait for the auth check so we send a valid token.
  //    Cache it so the room still opens offline.
  useEffect(() => {
    if (!ready) return;
    const cacheKey = `octocode-room-${id}`;
    getRoom(id)
      .then((r) => {
        localStorage.setItem(cacheKey, JSON.stringify(r));
        setRoom(r);
      })
      .catch((err: Error) => {
        if (err.message === "room not found") return setNotFound(true);
        if (err.message === "login required") return setNeedsLogin(true);
        if (err.message === "room is full") return setFull("room");
        if (err.message === "project is full") return setFull("project");
        const cached = localStorage.getItem(cacheKey);
        setRoom(cached ? JSON.parse(cached) : { _id: id, name: id, language: "python", createdAt: "" });
        addToast({ title: "Server unreachable", description: "Editing offline; changes sync later.", color: "warning" });
      });
  }, [id, ready]);

  // 2. Join the shared Yjs doc for this room once we know who the user is.
  useEffect(() => {
    if (!user || !room) return;
    const c = createCollab(id, user, getToken());
    setCollab(c);

    // Awareness = who's here right now (name, color, cursor). Not saved, just broadcast.
    const updatePeers = () => {
      const list: Peer[] = [];
      c.provider.awareness.getStates().forEach((state, clientId) => {
        if (state.user) list.push({ clientId, ...state.user });
      });
      setPeers(list);
    };
    c.provider.awareness.on("change", updatePeers);
    updatePeers();

    // Only the person who just created the room inserts the starter code, and only once
    // the doc has synced and is still empty. If everyone did this, two people opening a
    // new room together would each insert a copy (the CRDT would keep both).
    const insertStarter = (isSynced: boolean) => {
      if (!isSynced || !fresh) return;
      if (c.ytext.length === 0) c.ytext.insert(0, getLanguage(room.language).starter);
      navigate(location.pathname, { replace: true }); // drop the "fresh" flag so a refresh never re-inserts
    };
    c.provider.once("sync", insertStarter);

    return () => {
      c.provider.awareness.off("change", updatePeers);
      destroyCollab(c);
      setCollab(null);
    };
  }, [id, user, room]);

  async function run() {
    if (!collab || !room) return;
    setRunning(true);
    setResult(null);
    setResult(await runForLanguage(room.language, collab.ytext.toString()));
    setRunning(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    addToast({
      title: "Link copied",
      description: isProject ? "Teammates sign in, then the project opens for them." : "Send it to a friend to code together.",
      color: "success",
    });
  }

  // Projects are for signed-in users only: send guests to the login page and bring them back here after.
  if (needsLogin || (isProject && ready && !account)) {
    return <Navigate to={`/login?next=${encodeURIComponent(`/room/${id}`)}`} replace />;
  }

  if (notFound) {
    return (
      <Centered>
        <span className="grid size-14 place-items-center rounded-2xl bg-default-100 text-2xl">🫥</span>
        <p className="font-display text-xl font-semibold">Room “{id}” not found</p>
        <p className="max-w-sm text-center text-sm text-default-500">
          Quick sessions are deleted after 24 hours. Ask for a new link, or start your own.
        </p>
        <Button as={Link} to="/" color="primary" className="bg-brand">
          Back home
        </Button>
      </Centered>
    );
  }

  if (full) {
    return (
      <Centered>
        <span className="grid size-14 place-items-center rounded-2xl bg-default-100 text-2xl">👥</span>
        <p className="font-display text-xl font-semibold">This {full} is full</p>
        <p className="max-w-sm text-center text-sm text-default-500">
          {full === "room"
            ? "Everyone this quick session was made for is already here. Try again when someone leaves."
            : "This project has reached its team size, so new members can't join."}
        </p>
        <Button as={Link} to="/" color="primary" className="bg-brand">
          Back home
        </Button>
      </Centered>
    );
  }

  if (room && !isProject && !guest) {
    return <NamePrompt defaultName={account?.name ?? ""} onSave={(name) => setGuest(saveName(name))} />;
  }

  if (!room || !collab) {
    return (
      <Centered>
        <Spinner label="Opening room…" />
      </Centered>
    );
  }

  const lang = getLanguage(room.language);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* y-monaco tags remote cursors with yRemoteSelection(Head)-<clientID>; color + label them per user. */}
      <style>{cursorCss(peers, collab.ydoc.clientID)}</style>

      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-divider px-3 sm:px-4">
        <Logo compact />
        <span className="h-6 w-px bg-divider" />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-display truncate font-semibold">{room.name}</h1>
          <KindChip room={room} />
        </div>
        <div className="hidden md:block">
          <StatusChip provider={collab.provider} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AvatarGroup max={4} size="sm" className="hidden sm:flex">
            {peers.map((p) => (
              <Tooltip key={p.clientId} content={p.clientId === collab.ydoc.clientID ? `${p.name} (you)` : p.name}>
                <Avatar name={p.name} style={{ backgroundColor: p.color, color: "#000" }} />
              </Tooltip>
            ))}
          </AvatarGroup>
          <ThemeToggle />
          <Button size="sm" variant="flat" onPress={copyLink} startContent={<LinkIcon size={14} />} className="hidden sm:flex">
            Copy link
          </Button>
          <Button
            size="sm"
            color="primary"
            className="bg-brand font-medium shadow-md shadow-violet-500/25"
            isLoading={running}
            onPress={run}
            startContent={!running && <PlayIcon size={12} />}
          >
            Run
          </Button>
        </div>
      </header>

      {/* Fills all the space between the header and the status bar. On small screens the
          side panels stack under the editor; from "lg" up they sit on the right. */}
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:flex-row">
        <section className="flex min-h-[55%] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-divider bg-content1 lg:min-h-0">
          <div className="flex h-9 shrink-0 items-center border-b border-divider px-2">
            <span className="flex h-full items-center gap-2 border-b-2 border-primary px-3 font-mono text-xs">
              <span className="size-2 rounded-full" style={{ backgroundColor: lang.color }} />
              {lang.file}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              key={collab.ydoc.clientID}
              collab={collab}
              language={lang.monaco}
              onReady={(e) => (editorRef.current = e)}
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-1 flex-col gap-2 lg:w-[clamp(340px,30vw,500px)] lg:flex-none">
          <div className="min-h-0 flex-[3]">
            <AiChat
              language={room.language}
              getCode={() => collab.ytext.toString()}
              getSelection={() => {
                const e = editorRef.current;
                const sel = e?.getSelection();
                return e && sel ? e.getModel()!.getValueInRange(sel) : "";
              }}
            />
          </div>
          <div className="min-h-0 flex-[2]">
            <OutputPanel result={result} running={running} />
          </div>
        </aside>
      </main>

      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-divider px-4 text-[11px] text-default-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: lang.color }} />
          {lang.label}
        </span>
        <span>{lang.runsIn === "browser" ? "Runs in your browser" : "Runs in the sandbox"}</span>
        <span className="hidden sm:inline">
          {peers.length}/{room.teamSize ?? MAX_TEAM} people here
        </span>
        <span className="ml-auto hidden sm:inline">Synced live with CRDTs · works offline</span>
      </footer>
    </div>
  );
}

// "Temporary · 23h left" or "Project" next to the room name.
function KindChip({ room }: { room: RoomInfo }) {
  if (room.kind === "project") {
    return (
      <Chip size="sm" variant="flat" color="secondary" startContent={<FolderIcon size={12} className="ml-1" />}>
        Project
      </Chip>
    );
  }
  if (!room.expiresAt) return null; // rooms from before quick sessions had an expiry
  const msLeft = new Date(room.expiresAt).getTime() - Date.now();
  const hours = Math.floor(msLeft / 3_600_000);
  const left = hours >= 1 ? `${hours}h left` : `${Math.max(1, Math.ceil(msLeft / 60_000))}m left`;
  return (
    <Chip size="sm" variant="flat" color="warning" startContent={<ClockIcon size={12} className="ml-1" />}>
      <span className="hidden sm:inline">Temporary · </span>
      {left}
    </Chip>
  );
}

function cursorCss(peers: Peer[], myId: number) {
  return peers
    .filter((p) => p.clientId !== myId)
    .map((p) => {
      const label = p.name.replace(/["\\<>\n]/g, ""); // keep the name safe inside CSS content
      return `
.yRemoteSelection-${p.clientId} { background-color: ${p.color}; }
.yRemoteSelectionHead-${p.clientId} { border-color: ${p.color}; }
.yRemoteSelectionHead-${p.clientId}::after { content: "${label}"; background: ${p.color}; }`;
    })
    .join("\n");
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center gap-4 p-4">{children}</div>;
}

function NamePrompt({ defaultName, onSave }: { defaultName: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(defaultName);
  const save = () => name.trim() && onSave(name);
  return (
    <Centered>
      <Card className="w-full max-w-sm border border-divider">
        <CardBody className="flex flex-col gap-4 p-6">
          <div>
            <p className="font-display text-xl font-semibold">Join the session</p>
            <p className="text-sm text-default-500">What should others call you?</p>
          </div>
          <Input label="Your name" value={name} onValueChange={setName} onKeyDown={(e) => e.key === "Enter" && save()} autoFocus />
          <Button color="primary" className="bg-brand" onPress={save}>
            Join room
          </Button>
        </CardBody>
      </Card>
    </Centered>
  );
}
