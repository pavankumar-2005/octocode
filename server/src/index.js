import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { connectDb } from "./db.js";
import { setupPersistence, setupWSConnection } from "./yjs.js";
import roomsRouter from "./routes/rooms.js";
import aiRouter from "./routes/ai.js";
import runRouter from "./routes/run.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/rooms", roomsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/run", runRouter);

const server = http.createServer(app);
// noServer: we decide ourselves which upgrade requests become WebSockets.
const wss = new WebSocketServer({ noServer: true });

// One HTTP port serves both REST and the Yjs WebSocket (path /yjs/<roomId>).
server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (!pathname.startsWith("/yjs/")) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    // The room id in the URL is the Yjs doc name: everyone in a room shares one doc.
    const docName = decodeURIComponent(pathname.slice("/yjs/".length));
    setupWSConnection(ws, req, { docName });
  });
});

await connectDb();
setupPersistence();
server.listen(5000, () => console.log("server on :5000"));
