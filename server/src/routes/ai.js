import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  const { prompt, code, language } = req.body ?? {};
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const system = `You are a concise pair-programming assistant. Language: ${language ?? "unknown"}.`;
  const user = `${prompt}\n\nCurrent code:\n${code ?? ""}`;

  try {
    if (process.env.AI_PROVIDER === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The key stays on the server; the browser never sees it.
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message ?? `Gemini HTTP ${r.status}`);
      return res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "" });
    }

    const r = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? `Ollama HTTP ${r.status}`);
    res.json({ reply: data.message?.content ?? "" });
  } catch (err) {
    res.status(502).json({ error: "AI provider unreachable", detail: String(err) });
  }
});

export default router;
