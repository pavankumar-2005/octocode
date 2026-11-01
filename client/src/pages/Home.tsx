import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { addToast, Button, Card, CardBody, Chip, Divider, Input, Select, SelectItem } from "@heroui/react";
import Backdrop from "../components/Backdrop";
import TopNav from "../components/TopNav";
import { ArrowRightIcon, BoltIcon, CheckIcon, ClockIcon, FolderIcon, LockIcon, UsersIcon } from "../components/Icons";
import { createRoom } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LANGUAGES } from "../lib/languages";
import { loadUser, saveName } from "../lib/user";

// Cards slide up one after another when the page opens.
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

export default function Home() {
  return (
    <div className="relative isolate min-h-full overflow-x-hidden">
      <Backdrop />
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-8 sm:px-6 lg:pt-14">
        <motion.div {...rise(0)} className="flex flex-col items-center text-center">
          <Chip variant="flat" color="primary" size="sm" startContent={<span className="ml-1 size-1.5 animate-pulse rounded-full bg-success" />}>
            Live CRDT sync · AI pair programmer
          </Chip>
          <h1 className="font-display mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Code together,
            <br />
            <span className="text-brand">in real time.</span>
          </h1>
          <p className="mt-4 max-w-xl text-default-500 sm:text-lg">
            Pick how you want to work: a quick session that disappears tomorrow, or a project that stays as long as
            you need it.
          </p>
        </motion.div>

        <div className="mt-12 grid w-full gap-6 lg:grid-cols-2">
          <motion.div {...rise(0.1)}>
            <QuickSessionCard />
          </motion.div>
          <motion.div {...rise(0.2)}>
            <ProjectCard />
          </motion.div>
        </div>

        <motion.div {...rise(0.3)} className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm text-default-500">
          <span>Runs</span>
          {LANGUAGES.map((l) => (
            <span key={l.id} className="flex items-center gap-1.5 rounded-full border border-divider px-3 py-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

/* ---------- Quick session (temporary, no account) ---------- */

function QuickSessionCard() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const [name, setName] = useState(loadUser()?.name ?? account?.name ?? "");
  const [roomName, setRoomName] = useState("");
  const [language, setLanguage] = useState("python");
  const [joinId, setJoinId] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return addToast({ title: "Enter your name first", color: "warning" });
    saveName(name);
    setCreating(true);
    try {
      const room = await createRoom(roomName.trim(), language, "temporary");
      navigate(`/room/${room._id}`, { state: { fresh: true } });
    } catch (err) {
      addToast({ title: "Could not create room", description: (err as Error).message, color: "danger" });
    } finally {
      setCreating(false);
    }
  }

  function join() {
    if (!name.trim()) return addToast({ title: "Enter your name first", color: "warning" });
    // Accept either a bare room id or a pasted link like http://localhost:5173/room/abc123
    const id = joinId.trim().split("/").pop();
    if (!id) return addToast({ title: "Enter a room ID or link", color: "warning" });
    saveName(name);
    navigate(`/room/${id}`);
  }

  return (
    <ModeCard
      glow="from-amber-400/60 via-orange-500/40 to-transparent"
      icon={<BoltIcon size={22} />}
      iconClass="bg-gradient-to-br from-amber-400 to-orange-500"
      title="Quick session"
      tag={
        <Chip size="sm" variant="flat" color="warning" startContent={<ClockIcon size={12} className="ml-1" />}>
          Lasts 24 hours
        </Chip>
      }
      description="Spin up a room in seconds for an interview, a lab, or pairing on a bug. No account needed."
      features={["No sign-up, just a name", "Share one link to invite", "Deleted automatically after 24 h"]}
    >
      <div className="flex flex-col gap-3">
        <Input label="Your name" size="sm" value={name} onValueChange={setName} isRequired />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <Input label="Room name" size="sm" placeholder="DSA practice" value={roomName} onValueChange={setRoomName} />
          <Select
            label="Language"
            size="sm"
            selectedKeys={[language]}
            disallowEmptySelection
            onSelectionChange={(keys) => setLanguage(String(Array.from(keys)[0]))}
          >
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id}>{l.label}</SelectItem>
            ))}
          </Select>
        </div>
        <Button
          className="bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-white shadow-lg shadow-orange-500/25"
          isLoading={creating}
          onPress={create}
          endContent={!creating && <ArrowRightIcon size={16} />}
        >
          Start quick session
        </Button>
        <div className="flex items-center gap-3 text-xs text-default-400">
          <Divider className="flex-1" /> or join one <Divider className="flex-1" />
        </div>
        <div className="flex gap-2">
          <Input
            size="sm"
            label="Room ID or link"
            value={joinId}
            onValueChange={setJoinId}
            onKeyDown={(e) => e.key === "Enter" && join()}
          />
          <Button className="h-auto" variant="flat" onPress={join}>
            Join
          </Button>
        </div>
      </div>
    </ModeCard>
  );
}

/* ---------- Long-term project (account required) ---------- */

function ProjectCard() {
  const { account } = useAuth();

  return (
    <ModeCard
      glow="from-violet-500/60 via-cyan-500/40 to-transparent"
      icon={<FolderIcon size={22} />}
      iconClass="bg-brand"
      title="Long-term project"
      tag={
        <Chip size="sm" variant="flat" color="secondary" startContent={<LockIcon size={12} className="ml-1" />}>
          Sign-in required
        </Chip>
      }
      description="Projects that stay. Come back next week, next month, next semester: your code is right where you left it."
      features={["Saved until you're done", "All your projects on one dashboard", "Only signed-in teammates can open it"]}
    >
      <div className="flex h-full flex-col gap-4">
        {/* A small preview of the dashboard, so the card shows what you get. */}
        <div className="flex flex-col gap-2 rounded-xl border border-divider bg-default-50/60 p-3">
          {[
            { name: "Final-year project", lang: LANGUAGES[2], who: "4 members" },
            { name: "Algorithms notebook", lang: LANGUAGES[0], who: "Just you" },
            { name: "Hackathon API", lang: LANGUAGES[1], who: "2 members" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-lg bg-content1 px-3 py-2 text-sm shadow-sm">
              <span className="size-2 rounded-full" style={{ backgroundColor: p.lang.color }} />
              <span className="font-medium">{p.name}</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-default-400">
                <UsersIcon size={12} /> {p.who}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {account ? (
            <>
              <p className="text-sm text-default-500">
                Signed in as <span className="font-medium text-foreground">{account.name}</span>
              </p>
              <Button
                as={Link}
                to="/projects"
                color="primary"
                className="bg-brand font-medium shadow-lg shadow-violet-500/25"
                endContent={<ArrowRightIcon size={16} />}
              >
                Open my projects
              </Button>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button as={Link} to="/login?mode=signup" color="primary" className="bg-brand font-medium shadow-lg shadow-violet-500/25">
                Create account
              </Button>
              <Button as={Link} to="/login" variant="bordered">
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </ModeCard>
  );
}

/* ---------- Shared card frame ---------- */

type ModeCardProps = {
  glow: string;
  icon: ReactNode;
  iconClass: string;
  title: string;
  tag: ReactNode;
  description: string;
  features: string[];
  children: ReactNode;
};

function ModeCard({ glow, icon, iconClass, title, tag, description, features, children }: ModeCardProps) {
  return (
    // The outer div is a 1px gradient "border" that glows brighter on hover.
    <div className={`group h-full rounded-2xl bg-gradient-to-br ${glow} p-px transition-shadow hover:shadow-2xl`}>
      <Card className="h-full rounded-[15px] border-none bg-content1/90 shadow-none backdrop-blur-xl" radius="none">
        <CardBody className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span
              className={`${iconClass} grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform group-hover:-rotate-6 group-hover:scale-105`}
            >
              {icon}
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
              {tag}
            </div>
          </div>
          <p className="text-default-500">{description}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckIcon size={16} className="text-success" />
                {f}
              </li>
            ))}
          </ul>
          <Divider />
          <div className="flex-1">{children}</div>
        </CardBody>
      </Card>
    </div>
  );
}
