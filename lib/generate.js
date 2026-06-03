// Shared by both the local Express server (server.js) and the Vercel
// serverless function (api/generate.js). Supports OpenAI or Anthropic.
//
// Provider selection:
//   - Set LLM_PROVIDER=openai | anthropic to force one, OR
//   - leave it unset and it auto-detects: OpenAI if OPENAI_API_KEY is present,
//     otherwise Anthropic.

function clipText(value, max = 160) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function castList(fields) {
  return (fields?.cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => c.name.trim() + (c.role && c.role.trim() ? ` (${c.role.trim()})` : ""))
    .join(", ");
}

function castNames(fields) {
  return (fields?.cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => c.name.trim())
    .join(", ");
}

function castVisuals(fields) {
  const cast = (fields?.cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => {
      const name = c.name.trim();
      const role = c.role && c.role.trim() ? c.role.trim() : "core team lead";
      return `${name}: draw as a literal stick figure with a round head, line limbs, and one prop or pose inspired by "${role}"`;
    });
  return cast.length ? cast.join("; ") : "Invent a striking ensemble of literal stick-figure sprint collaborators with simple props";
}

function listFrom(value, maxItems, maxChars) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clipText(item, maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function quoteList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      quote: clipText(item?.quote, 56),
      source: clipText(item?.source, 32),
    }))
    .filter((item) => item.quote && item.source)
    .slice(0, 3);
}

function fallbackConcept(fields) {
  const f = fields || {};
  const cast = castList(f);
  const title = clipText(f.title || "Untitled Sprint", 60);
  return {
    posterHook: clipText(f.tagline || "One sprint. One deadline. No clean takes.", 72),
    titleTreatment: "bold, high-stakes, midnight-blue blockbuster",
    castBilling: clipText(cast || "The Ensemble Cast", 110),
    visualConcept: clipText(
      `A cinematic ${f.genre || "drama"} team poster about ${f.conflict || "mounting sprint pressure"} transforming into ${f.climax || "a hard-won team victory"}, with the collaborators framed as the central ensemble.`,
      220
    ),
    highlightMoments: [
      clipText(f.conflict || "Act II pressure spike", 40),
      clipText(f.climax || "Impossible ship lands", 40),
      clipText(f.postCredits || "Sequel sets a better habit", 40),
    ].filter(Boolean),
    artPrompt: clipText(
      `Cinematic portrait movie poster key art for the sprint "${title}". Genre: ${f.genre || "drama"}. Build a detailed, dramatic, bespoke background around ${f.conflict || "a tense sprint obstacle"} resolving into ${f.climax || "a hard-won win"}, but render ${cast || "the team"} as literal stick-figure protagonists only. Use round heads, line limbs, minimal prop silhouettes, absurd blockbuster scale, premium dramatic lighting, and a clean lower title space. No realistic humans, no realistic anatomy, and absolutely no typography of any kind inside the image: no words, no letters, no captions, no signs, no logos, no interface text, no watermark, no symbols that resemble text. Do not infer race, ethnicity, skin tone, age, or gender from names.`,
      700
    ),
  };
}

function fallbackPoster(fields) {
  const f = fields || {};
  const title = clipText(f.title || "A SPRINT", 60).toUpperCase();
  return {
    tagline: clipText(f.tagline || "Two weeks. One team. No do-overs.", 72),
    criticQuotes: [
      { quote: "A standup triumph.", source: "The Daily Standup" },
      { quote: "You'll laugh, you'll refactor.", source: "Velocity Weekly" },
    ],
    rating: "Rated S (for shipping drama)",
    runtime: "2 Weeks · One Sprint",
    billingBlock: clipText(
      `CORE BLUE STUDIOS presents ${title} - produced by the team, for the team, with zero calm standups and maximum delivery drama.`,
      150
    ),
    concept: fallbackConcept(f),
  };
}

function normalizeConcept(fields, rawConcept) {
  const fallback = fallbackConcept(fields);
  const raw = rawConcept && typeof rawConcept === "object" ? rawConcept : {};
  const highlights = listFrom(raw.highlightMoments, 3, 40);
  return {
    posterHook: clipText(raw.posterHook || fallback.posterHook, 72),
    titleTreatment: clipText(raw.titleTreatment || fallback.titleTreatment, 72),
    castBilling: clipText(raw.castBilling || fallback.castBilling, 110),
    visualConcept: clipText(raw.visualConcept || fallback.visualConcept, 220),
    highlightMoments: highlights.length ? highlights : fallback.highlightMoments,
    artPrompt: clipText(raw.artPrompt || fallback.artPrompt, 700),
  };
}

function normalizePoster(fields, raw) {
  const fallback = fallbackPoster(fields);
  const src = raw && typeof raw === "object" ? raw : {};
  const quotes = quoteList(src.criticQuotes);
  const conceptSource = src.concept && typeof src.concept === "object"
    ? src.concept
    : {
        posterHook: src.posterHook,
        titleTreatment: src.titleTreatment,
        castBilling: src.castBilling,
        visualConcept: src.visualConcept,
        highlightMoments: src.highlightMoments,
        artPrompt: src.artPrompt,
      };

  return {
    tagline: clipText(src.tagline || fallback.tagline, 72),
    criticQuotes: quotes.length ? quotes : fallback.criticQuotes,
    rating: clipText(src.rating || fallback.rating, 72),
    runtime: clipText(src.runtime || fallback.runtime, 32),
    billingBlock: clipText(src.billingBlock || fallback.billingBlock, 150),
    concept: normalizeConcept(fields, conceptSource),
  };
}

export function buildPrompt(fields) {
  const f = fields || {};
  const cast = castList(f);
  return `You are a witty Hollywood creative director making a bespoke movie poster concept for an Agile sprint retrospective.
Genre: ${f.genre || "drama"}
Sprint title: ${f.title || "Untitled"}
User tagline (optional): ${f.tagline || "none"}
Cast / collaborators: ${cast || "the team"}
What didn't go well (the conflict): ${f.conflict || "n/a"}
What went well (the triumphs): ${f.climax || "n/a"}
One action item for next sprint (post-credits): ${f.postCredits || "n/a"}

Return ONLY a JSON object (no markdown, no backticks, no preamble) with exactly this shape:
{
  "tagline": "punchy cinematic tagline, max 9 words",
  "criticQuotes": [
    { "quote": "max 6 words, funny", "source": "fake but plausible publication" }
  ],
  "rating": "MPAA-style rating, max 12 words",
  "runtime": "short fun runtime, max 20 characters",
  "billingBlock": "single-line studio billing block, max 22 words",
  "concept": {
    "posterHook": "campaign-style hook, max 10 words",
    "titleTreatment": "visual energy only, max 10 words",
    "castBilling": "cinematic cast line using names and maybe roles, max 14 words",
    "visualConcept": "describe the hero scene or composition, max 26 words",
    "highlightMoments": ["exactly 3 short beats, max 5 words each"],
    "artPrompt": "concise cinematic image prompt, max 70 words, no readable text, no logos, leave clean title space"
  }
}

Use the actual retro details so the poster feels custom to this sprint. When imagining the art direction, treat cast members as literal stick figures only: round heads, line limbs, simple props, no realistic faces or bodies. The humor should come from an overly dramatic bespoke background featuring absurdly simple stick-figure characters. Absolutely forbid any text or pseudo-text inside the generated image itself. Do not infer race, ethnicity, skin tone, age, body type, or gender from names. Keep everything tight enough to fit on a poster.`;
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

function hasImageProvider() {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL);
}

function buildImagePrompt(fields, ai) {
  const cast = castNames(fields) || "the team";
  const castLooks = castVisuals(fields);
  const concept = ai?.concept || fallbackConcept(fields);
  return clipText(
    `Create premium movie-poster hero art, portrait orientation, for the sprint "${fields?.title || "Untitled Sprint"}". ${concept.artPrompt} Main cast: ${cast}. Character direction: ${castLooks}. Critical style rule: every visible person must be a literal stick figure, not a realistic human, not semi-realistic, and not a silhouette with human anatomy. Use simple circle heads and line limbs only, with role-based props or poses to differentiate characters. Make the background large-scale, bespoke, moody, and cinematic, so the contrast between epic worldbuilding and absurd stick-figure heroes is funny. Make at least one lead stick figure feel specific and memorable through gesture, prop, placement, or scene role only. Never infer race, ethnicity, skin tone, age, body type, or gender from names. No facial detail beyond minimal dots if needed. Absolutely no text or pseudo-text anywhere in the image: no letters, words, taglines, titles, captions, signage, UI, logos, or watermark. Keep lower center area cleaner for the poster title.`,
    1400
  );
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

async function callOpenAIImage(fields, ai) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL;
  if (!key || !model) return null;

  const prompt = buildImagePrompt(fields, ai);
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1536",
      quality: "medium",
      output_format: "png",
    }),
  });
  if (!r.ok) throw fail("OpenAI image API error", 502, await r.text());
  const data = await r.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw fail("OpenAI image API did not return image data", 502);
  return {
    heroImage: `data:image/png;base64,${b64}`,
    heroPrompt: prompt,
  };
}

// Returns the parsed poster package, or throws Error with `.statusCode` (+ `.detail`).
export async function generateFlavor(fields) {
  const raw = pickProvider() === "openai" ? await callOpenAI(fields) : await callAnthropic(fields);
  const ai = normalizePoster(fields, raw);
  const assets = {};

  if (hasImageProvider()) {
    try {
      Object.assign(assets, await callOpenAIImage(fields, ai));
    } catch (_error) {
      // Hero art is optional. The poster should still render with procedural art.
    }
  }

  return { ai, assets };
}
