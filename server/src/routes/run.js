import { Router } from "express";

const router = Router();

// Java, C++ and C can't run in the browser, so the server forwards them to the
// runner container. The browser can't reach the runner directly (private network).
router.post("/", async (req, res) => {
  const { language, code } = req.body ?? {};
  if (!["java", "cpp", "c"].includes(language)) return res.status(400).json({ error: "unsupported language" });
  if (typeof code !== "string") return res.status(400).json({ error: "code required" });

  try {
    const r = await fetch(`${process.env.RUNNER_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
      signal: AbortSignal.timeout(40000), // compile (15 s) + run (10 s) + slack
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data); // { ok, output }
  } catch (err) {
    res.status(502).json({ error: "code runner unreachable", detail: String(err) });
  }
});

export default router;
