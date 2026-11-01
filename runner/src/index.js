import express from "express";
import { isSupported, run } from "./run.js";

// Only reachable from the OctoCode server over the private "sandbox" network (see docker-compose.yml).
const app = express();
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/run", async (req, res) => {
  const { language, code } = req.body ?? {};
  if (!isSupported(language)) return res.status(400).json({ error: "unsupported language" });
  if (typeof code !== "string") return res.status(400).json({ error: "code required" });
  res.json(await run(language, code));
});

app.listen(7000, () => console.log("runner on :7000"));
