import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { connectDb } from "./db.js";
import { setupPersistence, setupWSConnection } from "./yjs.js";
import { attachUser, userFromToken } from "./auth.js";
import authRouter from "./routes/auth.js";
import roomsRouter, { findLiveRoom } from "./routes/rooms.js";
import aiRouter from "./routes/ai.js";
import runRouter from "./routes/run.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.use(attachUser); // req.user = logged-in user or null
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/run", runRouter);

const server = http.createServer(app);
// noServer: we decide ourselves which upgrade requests become WebSockets.
const wss = new WebSocketServer({ noServer: true });

// Who may open this room's live document? Temporary rooms: anyone with the link.
// Projects: only signed-in members. Checking here (not just in the UI) means
// nobody can read or edit a project by talking to the WebSocket directly.
async function canJoin(roomId, token) {
  const room = await findLiveRoom(roomId);
  if (!room) return false; // unknown or expired room
  if (room.kind !== "project") return true;
  const user = await userFromToken(token);
  return Boolean(user && room.members.includes(user._id));
}

// One HTTP port serves both REST and the Yjs WebSocket (path /yjs/<roomId>?token=...).
server.on("upgrade", async (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/yjs/")) return socket.destroy();
  // The room id in the URL is the Yjs doc name: everyone in a room shares one doc.
  const docName = decodeURIComponent(url.pathname.slice("/yjs/".length));
  // Browsers can't set headers on a WebSocket, so the client sends its token in the URL.
  const allowed = await canJoin(docName, url.searchParams.get("token")).catch(() => false);
  if (!allowed) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => setupWSConnection(ws, req, { docName }));
});

await connectDb();
setupPersistence();
server.listen(5000, () => console.log("server on :5000"));
