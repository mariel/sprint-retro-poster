// Shared by both the local Express server (server.js) and the Vercel
// serverless function (api/generate.js). Reads config from env at call time.

export function buildPrompt(fields) {
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

// Calls Anthropic and returns the parsed flavor object.
// Throws Error with a `.statusCode` (and optional `.detail`) so callers
// can map it to an HTTP response.
export async function generateFlavor(fields) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  if (!API_KEY) {
    const e = new Error("ANTHROPIC_API_KEY is not set. Add it in your host's environment variables (or .env locally).");
    e.statusCode = 500;
    throw e;
  }

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
      messages: [{ role: "user", content: buildPrompt(fields) }],
    }),
  });

  if (!r.ok) {
    const e = new Error("Anthropic API error");
    e.statusCode = 502;
    e.detail = await r.text();
    throw e;
  }

  const data = await r.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
}
