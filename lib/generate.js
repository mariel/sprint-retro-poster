// Shared by both the local Express server (server.js) and the Vercel
// serverless function (api/generate.js). Supports OpenAI or Anthropic.
//
// Provider selection:
//   - Set LLM_PROVIDER=openai | anthropic to force one, OR
//   - leave it unset and it auto-detects: OpenAI if OPENAI_API_KEY is present,
//     otherwise Anthropic.

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

function parseJsonLoose(text) {
  const clean = String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
}

function fail(message, statusCode, detail) {
  const e = new Error(message);
  e.statusCode = statusCode;
  if (detail) e.detail = detail;
  return e;
}

function pickProvider() {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase().trim();
  if (explicit === "openai" || explicit === "anthropic") return explicit;
  return process.env.OPENAI_API_KEY ? "openai" : "anthropic";
}

async function callOpenAI(fields) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!key) throw fail("OPENAI_API_KEY is not set. Add it in your host's environment variables (or .env locally).", 500);

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(fields) }],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) throw fail("OpenAI API error", 502, await r.text());
  const data = await r.json();
  return parseJsonLoose(data.choices?.[0]?.message?.content);
}

async function callAnthropic(fields) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  if (!key) throw fail("ANTHROPIC_API_KEY is not set. Add it in your host's environment variables (or .env locally).", 500);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [{ role: "user", content: buildPrompt(fields) }],
    }),
  });
  if (!r.ok) throw fail("Anthropic API error", 502, await r.text());
  const data = await r.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return parseJsonLoose(text);
}

// Returns the parsed flavor object, or throws Error with `.statusCode` (+ `.detail`).
export async function generateFlavor(fields) {
  return pickProvider() === "openai" ? callOpenAI(fields) : callAnthropic(fields);
}
