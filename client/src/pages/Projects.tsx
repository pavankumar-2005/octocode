import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { addToast, Button, Card, CardBody, Chip, Input, Select, SelectItem, Skeleton } from "@heroui/react";
import Backdrop from "../components/Backdrop";
import TopNav from "../components/TopNav";
import ProjectTile from "../components/ProjectTile";
import TeamSizeSelect from "../components/TeamSizeSelect";
import { ArrowRightIcon, FolderIcon, PlusIcon } from "../components/Icons";
import { createRoom, listProjects, type Room } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LANGUAGES } from "../lib/languages";

export default function Projects() {
  const { account, ready } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Room[] | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("python");
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState("");

  useEffect(() => {
    if (!account) return;
    listProjects()
      .then(setProjects)
      .catch((err: Error) => {
        addToast({ title: "Could not load projects", description: err.message, color: "danger" });
        setProjects([]);
      });
  }, [account?._id]);

  if (ready && !account) return <Navigate to="/login?next=/projects" replace />;

  async function create() {
    if (!name.trim()) return addToast({ title: "Give your project a name", color: "warning" });
    if (!teamSize) return addToast({ title: "Choose your team size", color: "warning" });
    setCreating(true);
    try {
      const room = await createRoom(name.trim(), language, "project", teamSize);
      navigate(`/room/${room._id}`, { state: { fresh: true } });
    } catch (err) {
      addToast({ title: "Could not create project", description: (err as Error).message, color: "danger" });
      setCreating(false);
    }
  }

  function open() {
    // Accept a bare id or a pasted link. Opening a teammate's project adds it to this dashboard.
    const id = openId.trim().split("/").pop();
    if (id) navigate(`/room/${id}`);
  }

  const firstName = account?.name.split(" ")[0] ?? "";

  return (
    <div className="relative isolate min-h-full overflow-x-hidden">
      <Backdrop />
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, <span className="text-brand">{firstName}</span>
          </h1>
          <p className="mt-1 text-default-500">
            Your long-term projects. They stay saved, and teammates who sign in can open them with the link.
          </p>
        </motion.div>

        {/* New project + open by link */}
        <div className="mt-8 grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card className="border border-divider bg-content1/80 shadow-sm backdrop-blur-xl">
            <CardBody className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <span className="bg-brand hidden size-10 shrink-0 place-items-center rounded-xl text-white sm:grid">
                <PlusIcon />
              </span>
              <Input
                size="sm"
                label="New project name"
                placeholder="Final-year project"
                value={name}
                onValueChange={setName}
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
              <Select
                size="sm"
                label="Language"
                className="sm:w-40 sm:shrink-0"
                selectedKeys={[language]}
                disallowEmptySelection
                onSelectionChange={(keys) => setLanguage(String(Array.from(keys)[0]))}
              >
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id}>{l.label}</SelectItem>
                ))}
              </Select>
              <TeamSizeSelect value={teamSize} onChange={setTeamSize} className="sm:w-40 sm:shrink-0" />
              <Button color="primary" className="bg-brand shrink-0 font-medium" isLoading={creating} onPress={create}>
                Create
              </Button>
            </CardBody>
          </Card>
          <Card className="border border-divider bg-content1/80 shadow-sm backdrop-blur-xl">
            <CardBody className="flex flex-row items-center gap-2 p-5">
              <Input
                size="sm"
                label="Open a teammate's project"
                placeholder="Paste link or ID"
                value={openId}
                onValueChange={setOpenId}
                onKeyDown={(e) => e.key === "Enter" && open()}
              />
              <Button isIconOnly variant="flat" aria-label="Open project" onPress={open}>
                <ArrowRightIcon />
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Project grid */}
        <div className="mt-8 flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Projects</h2>
          {projects && <Chip size="sm" variant="flat">{projects.length}</Chip>}
        </div>

        {!projects ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-divider px-6 py-16 text-center">
            <span className="bg-brand grid size-14 place-items-center rounded-2xl text-white shadow-lg shadow-violet-500/30">
              <FolderIcon size={26} />
            </span>
            <p className="font-display text-lg font-semibold">No projects yet</p>
            <p className="max-w-sm text-sm text-default-500">
              Create your first project above. It stays saved, so you can come back to it any time.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
              >
                <ProjectTile project={p} isOwner={p.ownerId === account?._id} onOpen={() => navigate(`/room/${p._id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
