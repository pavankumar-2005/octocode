import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast, Button, Card, CardBody, CardHeader, Divider, Input, Select, SelectItem } from "@heroui/react";
import { createRoom } from "../lib/api";
import { LANGUAGES } from "../lib/languages";
import { loadUser, saveName } from "../lib/user";

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState(loadUser()?.name ?? "");
  const [roomName, setRoomName] = useState("");
  const [language, setLanguage] = useState("python");
  const [joinId, setJoinId] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return addToast({ title: "Enter your name first", color: "warning" });
    saveName(name);
    setCreating(true);
    try {
      const room = await createRoom(roomName.trim(), language);
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
    <main className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md" radius="lg">
        <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
          <h1 className="text-2xl font-semibold">🐙 OctoCode</h1>
          <p className="text-sm text-default-500">Real-time collaborative coding with CRDTs and an AI pair programmer.</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 px-6 pb-6">
          <Input label="Your name" value={name} onValueChange={setName} isRequired />
          <Divider />
          <Input label="Room name" placeholder="DSA practice" value={roomName} onValueChange={setRoomName} />
          <Select
            label="Language"
            selectedKeys={[language]}
            disallowEmptySelection
            onSelectionChange={(keys) => setLanguage(String(Array.from(keys)[0]))}
          >
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id}>{l.label}</SelectItem>
            ))}
          </Select>
          <Button color="primary" isLoading={creating} onPress={create}>
            Create room
          </Button>
          <Divider />
          <div className="flex gap-2">
            <Input
              label="Room ID or link"
              value={joinId}
              onValueChange={setJoinId}
              onKeyDown={(e) => e.key === "Enter" && join()}
            />
            <Button className="h-auto" variant="flat" onPress={join}>
              Join
            </Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
