# CLAUDE.md

Project context for Claude Code. Read this before making changes.

## What this is

A small web app that turns an Agile sprint retrospective into a downloadable
movie poster. The user fills a form (mapped to retro prompts), an LLM writes the
movie-marketing flavor text, and the app renders a genre-themed poster as SVG.

## Stack & architecture

- **Frontend:** React 18 + Vite (`src/`). No component library; styles are inline.
- **Backend (two interchangeable entry points, one shared core):**
  - `lib/generate.js` — the single source of truth: builds the prompt, calls
    Anthropic, returns parsed `{ ai }`. Reads `ANTHROPIC_API_KEY` from env.
  - `server.js` — Express, for local dev (`npm run dev`) and non-serverless hosts
    (`npm start`, e.g. Render/Railway/Fly). Also serves the built `dist/`.
  - `api/generate.js` — Vercel serverless function. On Vercel, this is the backend
    and `server.js` is unused.
  The key is read server-side in both paths and is **never** exposed to the browser.
- **Dev:** `npm run dev` runs Express (:3001) and Vite (:5173) together via
  `concurrently`. Vite proxies `/api` -> :3001 (see `vite.config.js`). Alternatively
  `npm run dev:vercel` (`vercel dev`) mirrors the serverless prod setup.

## Key files

| File | Responsibility |
|------|----------------|
| `src/App.jsx` | UI, form state, calls `/api/generate`, triggers PNG export |
| `src/poster.js` | `buildPoster(fields, ai)` returns the poster as an **SVG string** + text/wrap helpers |
| `src/genres.js` | `GENRES` map — palette + motif per genre (the whole look comes from here) |
| `lib/generate.js` | shared prompt builder + Anthropic call; throws `Error` with `.statusCode` |
| `server.js` | Express entry (local dev / non-serverless hosts); imports `lib/generate.js` |
| `api/generate.js` | Vercel function entry; imports `lib/generate.js` |

## Important conventions / gotchas

- **The poster is one self-contained SVG string**, not React/DOM nodes. This is
  deliberate: it serializes cleanly to a Blob and rasterizes to PNG via `<canvas>`
  in `App.jsx` `download()`.
- **Poster fonts are web-safe on purpose** (Arial Black for the title, Georgia
  italic for the tagline, Courier for the "production notes"). External webfonts
  do NOT survive the SVG→canvas→PNG rasterization, so do not switch the poster
  to Google Fonts or the downloaded PNG will fall back to system fonts. (The app
  *chrome* uses Archivo / JetBrains Mono via `src/index.css` — that's fine, it's
  never exported.)
- **SVG has no text wrapping.** Use the `wrap()` helper in `poster.js`; sizes are
  tuned by approximate character counts. If you change a font size, re-tune the
  `maxChars` argument.
- **Always escape user input** going into the SVG with `esc()` (already done) —
  raw `&`/`<`/`>` would break the markup.
- The LLM output is parsed defensively (strip code fences, slice to outer braces).
  `App.jsx` has a `fallbackAI()` so the poster still renders if the API fails.

## Adding a genre

Add one entry to `GENRES` in `src/genres.js`. `motif` must be one of:
`sunburst | grid | fog | spotlight | explosion | bokeh` (defined in `motifArt()`
in `poster.js`). Add a new motif there if you want a new background style.

## Model

Default model is `claude-sonnet-4-6`, overridable via `ANTHROPIC_MODEL` in `.env`.
For this lightweight copy task `claude-haiku-4-5` is cheaper/faster. Verify current
model IDs at https://platform.claude.com/docs/en/about-claude/models/overview

## Commands

- `npm install` — install deps
- `npm run dev` — dev (server + client with hot reload)
- `npm run build` — build frontend to `dist/`
- `npm start` — run the server serving the built app (single process, prod-style)
