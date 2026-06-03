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

**Prerequisites:** Node.js 18+ and an Anthropic API key (`platform.claude.com` → API Keys).

```bash
npm install
cp .env.example .env        # then paste your key into .env
npm run dev
```

Open **http://localhost:5173**. The Vite dev server runs the UI and proxies
`/api` calls to the Express server on port 3001, which holds your API key.

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
├── vite.config.js       # dev server + /api proxy
├── index.html
├── server.js            # Express: /api/generate (holds the API key) + serves dist/
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

- No data is stored; everything lives in memory for the session.
- If the API call fails, the app falls back to canned copy so the poster still renders.
- `ANTHROPIC_MODEL` in `.env` swaps the model (try `claude-haiku-4-5` for cheap/fast).
