# 🎬 Sprint Retro: The Movie

Turn your team's sprint retrospective into a downloadable **movie poster**.
Fill in a short studio "casting sheet," and an LLM writes the cinematic flavor
(critic blurbs, MPAA-style rating, runtime, studio billing block) tuned to your
actual sprint. The poster's whole look changes with the genre you pick.

The form maps to a real scrum retro:

| Poster field | Retro meaning |
|---|---|
| Title | Sprint name / theme |
| Tagline | One-line summary |
| Genre | Team mood / vibe (drives the visuals) |
| Cast | Shout-outs to who you worked with |
| The Conflict | What didn't go well |
| The Triumphs | What went well |
| Post-Credits Scene | The ONE action item for next sprint |

---

## Quick start

**Prerequisites:** Node.js 18+ and an API key from **either** OpenAI or Anthropic.

```bash
npm install
cp .env.example .env        # then paste ONE provider's key into .env
npm run dev
```

Open **http://localhost:5173**. The Vite dev server runs the UI and proxies
`/api` calls to the Express server on port 3001, which holds your API key.

### Which provider?

The backend auto-detects: if `OPENAI_API_KEY` is set it uses OpenAI, otherwise it
uses `ANTHROPIC_API_KEY`. Force a choice with `LLM_PROVIDER=openai|anthropic`.
Defaults: OpenAI `gpt-4o-mini`, Anthropic `claude-sonnet-4-6` — both overridable
(`OPENAI_MODEL` / `ANTHROPIC_MODEL`). The copy task is light, so a cheap/mini
model is plenty.

### Production-style run

```bash
npm run build   # builds the frontend into dist/
npm start       # Express serves dist/ + the API on http://localhost:3001
```

---

## How it's wired (and why)

- **Frontend** — React + Vite, in `src/`.
- **Backend** — one small Express server (`server.js`) exposing `POST /api/generate`.
  Your API key lives only on the server (loaded from `.env`), so it never reaches
  the browser. This is the key difference from a chat-artifact prototype, where the
  sandbox injects auth for you — that trick doesn't work in a real app.
- The poster is rendered as a **single SVG string** and exported to PNG with
  `<canvas>`. It uses web-safe fonts on purpose so the downloaded image matches
  what's on screen. See `CLAUDE.md` for the full rationale and gotchas.

---

## Deploying

This repo supports two hosting styles out of the box.

### Vercel (serverless) — recommended

Vercel serves the built frontend from its CDN and runs `api/generate.js` as an
on-demand serverless function. The Express server (`server.js`) is **not** used
on Vercel — both share `lib/generate.js`, so there's no duplicated logic.

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **New Project → import the repo.** It auto-detects Vite
   (build `vite build`, output `dist`) and deploys `/api` as functions.
   No `vercel.json` needed.
3. Add an Environment Variable: **`OPENAI_API_KEY`** *or* **`ANTHROPIC_API_KEY`**
   (optionally `OPENAI_MODEL` / `ANTHROPIC_MODEL`, or `LLM_PROVIDER` to force one).
   Set it for Production (and Preview if you want PR previews to work), then deploy.

Or from the CLI:

```bash
npm i -g vercel
vercel            # first run links/creates the project
vercel env add ANTHROPIC_API_KEY     # paste your key
vercel --prod
```

To run the serverless setup locally exactly as it runs in prod, use `vercel dev`
(also available as `npm run dev:vercel`).

> Note: the key lives only in Vercel's server-side env and is read inside the
> function — it's never shipped to the browser. Don't prefix it with `VITE_`,
> or it would get bundled into client code.

### Render / Railway / Fly / a VPS (one long-running server)

These run the Express server, which serves the API **and** the built frontend:

```bash
npm install
npm run build
npm start          # serves dist/ + /api on $PORT (default 3001)
```

Set `ANTHROPIC_API_KEY` in the host's environment. Build command `npm run build`,
start command `npm start`.

---

## Working on this with Claude Code

This repo includes a `CLAUDE.md` that gives Claude Code the project context,
architecture, and the non-obvious constraints (e.g. why the poster fonts are
web-safe). That means you can ask for changes in plain language and it'll respect
the design.

**Install Claude Code** (native installer is the recommended method now; npm still works):

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash
# Homebrew
brew install --cask claude-code
# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
# npm (deprecated but supported; needs Node 18+)
npm install -g @anthropic-ai/claude-code
```

Then, from this folder:

```bash
claude
```

(Run `claude doctor` if anything looks off. Claude Code needs a Claude
Pro/Max/Team/Enterprise or API account — the free Claude.ai plan doesn't include it.)

Things to try asking it:

- "Add a new genre called *Western* with a dusty orange palette."
- "Make the cast names bigger and add their roles under each name on the poster."
- "Add a second action item slot to the post-credits section."
- "Let me upload a team photo and use it as the poster background."

Current docs: https://docs.claude.com/en/docs/claude-code/overview

---

## Project structure

```
sprint-retro-poster/
├── CLAUDE.md            # project memory for Claude Code (read this!)
├── README.md
├── package.json
├── vite.config.js       # dev server + /api proxy (local dev only)
├── index.html
├── server.js            # Express: serves /api + dist/ for local dev & non-serverless hosts
├── api/
│   └── generate.js      # Vercel serverless function for POST /api/generate
├── lib/
│   └── generate.js      # shared: prompt builder + Anthropic call (used by both backends)
├── .env.example
└── src/
    ├── main.jsx         # React entry
    ├── App.jsx          # UI, form state, PNG export
    ├── poster.js        # buildPoster() -> SVG string, text/wrap helpers
    ├── genres.js        # genre palettes + motifs (the whole look)
    └── index.css        # base styles + app-chrome fonts
```

---

## Notes

- Works with **OpenAI or Anthropic** — set whichever key you have (see "Which provider?").
- No data is stored; everything lives in memory for the session.
- If the API call fails, the app falls back to canned copy so the poster still renders.
- Swap models via `OPENAI_MODEL` / `ANTHROPIC_MODEL` in `.env`.
