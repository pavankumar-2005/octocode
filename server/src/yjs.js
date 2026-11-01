import { createRequire } from "module";
import { getDb } from "./db.js";

// y-websocket/bin/utils is CommonJS and require()s the CommonJS build of yjs.
// Loading yjs the same way (require, not import) gives us ONE shared Yjs instance;
// two instances cause the "Yjs was already imported" bug and broken docs.
const require = createRequire(import.meta.url);
const Y = require("yjs");
const { setupWSConnection, setPersistence } = require("y-websocket/bin/utils");

export { setupWSConnection };

const col = () => getDb().collection("yjs_docs");

async function save(docName, ydoc) {
  // A Yjs doc is stored as ONE binary "update" blob: the full document state.
  const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  await col().updateOne(
    { _id: docName },
    { $set: { update, updatedAt: new Date() } },
    { upsert: true }
  );
}

export function setupPersistence() {
  setPersistence({
    provider: "mongodb",
    // Runs when the first client opens a room: load saved state into the doc.
    bindState: async (docName, ydoc) => {
      const saved = await col().findOne({ _id: docName });
      // Applying the saved state is a normal CRDT merge, so it is safe even if
      // a client already sent edits before this finished loading.
      if (saved) Y.applyUpdate(ydoc, new Uint8Array(saved.update.buffer));
      let timer;
      ydoc.on("update", () => {
        clearTimeout(timer); // debounce: save 1 s after the last keystroke
        timer = setTimeout(() => save(docName, ydoc).catch(console.error), 1000);
      });
    },
    // Runs when the last client leaves.
    writeState: async (docName, ydoc) => save(docName, ydoc),
  });
}
