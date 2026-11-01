import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { addToast, Avatar, AvatarGroup, Button, Card, CardBody, Input, Spinner } from "@heroui/react";
import type { editor } from "monaco-editor";
import CodeEditor from "../components/CodeEditor";
import OutputPanel from "../components/OutputPanel";
import AiChat from "../components/AiChat";
import StatusChip from "../components/StatusChip";
import { getRoom, type Room as RoomInfo } from "../lib/api";
import { createCollab, destroyCollab, type Collab, type User } from "../lib/collab";
import { getLanguage } from "../lib/languages";
import { runForLanguage, type RunResult } from "../lib/runCode";
import { loadUser, saveName } from "../lib/user";

type Peer = { clientId: number; name: string; color: string };

export default function Room() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fresh = Boolean((location.state as { fresh?: boolean } | null)?.fresh);
  const [user, setUser] = useState<User | null>(loadUser);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [collab, setCollab] = useState<Collab | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 1. Load room info (name + language). Cache it so the room still opens offline.
  useEffect(() => {
    const cacheKey = `octocode-room-${id}`;
    getRoom(id)
      .then((r) => {
        localStorage.setItem(cacheKey, JSON.stringify(r));
        setRoom(r);
      })
      .catch((err: Error) => {
        if (err.message === "room not found") return setNotFound(true);
        const cached = localStorage.getItem(cacheKey);
        setRoom(cached ? JSON.parse(cached) : { _id: id, name: id, language: "python", createdAt: "" });
        addToast({ title: "Server unreachable", description: "Editing offline; changes sync later.", color: "warning" });
      });
  }, [id]);

  // 2. Join the shared Yjs doc for this room once we know who the user is.
  useEffect(() => {
    if (!user || !room) return;
    const c = createCollab(id, user);
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
    addToast({ title: "Link copied", description: "Send it to a friend to code together.", color: "success" });
  }

  if (notFound) {
    return (
      <Centered>
        <p className="text-lg">Room “{id}” not found.</p>
        <Button as={Link} to="/" color="primary">
          Back home
        </Button>
      </Centered>
    );
  }

  if (!user) return <NamePrompt onSave={(name) => setUser(saveName(name))} />;

  if (!room || !collab) {
    return (
      <Centered>
        <Spinner label="Opening room…" />
      </Centered>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* y-monaco tags remote cursors with yRemoteSelection(Head)-<clientID>; color + label them per user. */}
      <style>{cursorCss(peers, collab.ydoc.clientID)}</style>

      <header className="flex items-center gap-3 border-b border-default-100 px-4 py-2">
        <Link to="/" className="font-semibold">
          🐙 OctoCode
        </Link>
        <span className="text-default-500">/ {room.name}</span>
        <span className="rounded bg-default-100 px-2 py-0.5 text-xs text-default-500">{getLanguage(room.language).label}</span>
        <StatusChip provider={collab.provider} />
        <div className="ml-auto flex items-center gap-3">
          <AvatarGroup max={5} size="sm">
            {peers.map((p) => (
              <Avatar key={p.clientId} name={p.name} title={p.name} style={{ backgroundColor: p.color, color: "#000" }} />
            ))}
          </AvatarGroup>
          <Button size="sm" variant="flat" onPress={copyLink}>
            Copy link
          </Button>
          <Button size="sm" color="primary" isLoading={running} onPress={run}>
            ▶ Run
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-3 p-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-default-100">
          <CodeEditor
            key={collab.ydoc.clientID}
            collab={collab}
            language={getLanguage(room.language).monaco}
            onReady={(e) => (editorRef.current = e)}
          />
        </div>
        <aside className="flex w-[380px] shrink-0 flex-col gap-3">
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
    </div>
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
  return <div className="flex h-full flex-col items-center justify-center gap-4">{children}</div>;
}

function NamePrompt({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  const save = () => name.trim() && onSave(name);
  return (
    <Centered>
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-3 p-6">
          <p className="font-medium">What should others call you?</p>
          <Input label="Your name" value={name} onValueChange={setName} onKeyDown={(e) => e.key === "Enter" && save()} />
          <Button color="primary" onPress={save}>
            Join room
          </Button>
        </CardBody>
      </Card>
    </Centered>
  );
}
