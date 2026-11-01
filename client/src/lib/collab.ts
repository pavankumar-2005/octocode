import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export type User = { name: string; color: string };

export function createCollab(roomId: string, user: User) {
  const ydoc = new Y.Doc();
  // Offline-first: edits are saved in the browser (IndexedDB) and merged on reconnect.
  const offline = new IndexeddbPersistence(`octocode-${roomId}`, ydoc);
  // Connects to ws://localhost:5050/yjs/<roomId>
  const provider = new WebsocketProvider(import.meta.env.VITE_WS_URL, roomId, ydoc);
  provider.awareness.setLocalStateField("user", user); // presence: name + color
  return { ydoc, provider, offline, ytext: ydoc.getText("code") };
}

export type Collab = ReturnType<typeof createCollab>;

export function destroyCollab(collab: Collab) {
  collab.provider.destroy(); // closes the WebSocket and removes our cursor for others
  collab.offline.destroy();
  collab.ydoc.destroy();
}
