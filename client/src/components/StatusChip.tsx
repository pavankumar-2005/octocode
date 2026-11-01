import { useEffect, useState } from "react";
import { Chip } from "@heroui/react";
import type { WebsocketProvider } from "y-websocket";

type Props = { provider: WebsocketProvider };

export default function StatusChip({ provider }: Props) {
  const [wsStatus, setWsStatus] = useState<string>(provider.wsconnected ? "connected" : "connecting");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    // y-websocket emits "status": connecting | connected | disconnected (it reconnects by itself).
    const onStatus = (e: { status: string }) => setWsStatus(e.status);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    provider.on("status", onStatus);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      provider.off("status", onStatus);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [provider]);

  if (!online) return <Chip color="warning" variant="dot">Offline · saved locally</Chip>;
  if (wsStatus === "connected") return <Chip color="success" variant="dot">Online</Chip>;
  return <Chip color="default" variant="dot">Syncing…</Chip>;
}
