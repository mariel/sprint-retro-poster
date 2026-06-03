import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "256kb" }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/* Build the prompt from the retro fields. */
function buildPrompt(fields) {
  const f = fields || {};
  const cast = (f.cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => c.name + (c.role ? ` (${c.role})` : ""))
    .join(", ");
  return `You are a witty Hollywood marketing copywriter making a movie poster for an Agile sprint retrospective. Genre: ${f.genre || "drama"}.
Sprint title: ${f.title || "Untitled"}
User tagline (optional): ${f.tagline || "none"}
Cast / collaborators: ${cast || "the team"}
What didn't go well (the conflict): ${f.conflict || "n/a"}
What went well (the triumphs): ${f.climax || "n/a"}
One action item for next sprint (post-credits): ${f.postCredits || "n/a"}

Write playful, sprint-themed movie-marketing copy that matches the genre's voice. Return ONLY a JSON object (no markdown, no backticks, no preamble) with exactly these keys:
{"tagline": "a punchy cinematic tagline, max 9 words", "criticQuotes": [{"quote":"max 6 words, funny","source":"a fake but plausible publication name"}], "rating": "an MPAA-style rating like 'Rated S' with a 1-line reason in parentheses, total max 12 words", "runtime": "a short fun runtime like '2 Weeks · One Sprint'", "billingBlock": "a single-line studio billing block in ALL CAPS movie-credits style mentioning the cast, max 22 words"}
Provide 2 or 3 criticQuotes. Keep everything tight enough to fit on a poster.`;
}

app.post("/api/generate", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key." });
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: buildPrompt(req.body.fields) }],
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "Anthropic API error", detail });
    }
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const ai = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
    res.json({ ai });
  } catch (e) {
    res.status(500).json({ error: "Generation failed", detail: String(e) });
  }
});

/* Serve the built frontend in production (after `npm run build`). */
const dist = path.join(__dirname, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n  🎬 Retro Pictures API on http://localhost:${PORT}`);
  console.log(`     Model: ${MODEL}`);
  console.log(API_KEY ? "     API key: loaded ✓\n" : "     API key: MISSING — add it to .env\n");
});
