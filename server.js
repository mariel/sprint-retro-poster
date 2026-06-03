import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateFlavor } from "./lib/generate.js";

// Local dev server + an option for non-serverless hosts (Render, Railway, Fly,
// a VPS, etc.) via `npm start`. On Vercel this file is unused — api/generate.js
// is the backend instead. Both share lib/generate.js, so there is one source of truth.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "256kb" }));

const PORT = process.env.PORT || 3001;

app.post("/api/generate", async (req, res) => {
  try {
    const ai = await generateFlavor(req.body && req.body.fields);
    res.json({ ai });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message, detail: e.detail });
  }
});

// Serve the built frontend in production (after `npm run build`).
const dist = path.join(__dirname, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  console.log(`\n  🎬 Retro Pictures API on http://localhost:${PORT}`);
  console.log(`     Model: ${model}`);
  console.log(hasKey ? "     API key: loaded ✓\n" : "     API key: MISSING — add it to .env\n");
});
