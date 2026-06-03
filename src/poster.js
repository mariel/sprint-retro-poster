import { GENRES } from "./genres.js";

/* ---------- text helpers ---------- */
export const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function wrap(text, maxChars, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur.length) { cur = w; continue; }
    if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    let last = lines[lines.length - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    lines[lines.length - 1] = last.replace(/[.,;:]?$/, "") + "…";
  }
  return lines.length ? lines : [""];
}

function tspans(lines, x, dy, attrs = "") {
  return lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : dy}" ${attrs}>${esc(l)}</tspan>`)
    .join("");
}

/* ---------- motif art (drawn within the 800-wide art zone) ---------- */
function motifArt(g) {
  const { motif, accent, accent2 } = g;
  if (motif === "sunburst") {
    let rays = "";
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const x = 400 + Math.cos(a) * 900, y = 300 + Math.sin(a) * 900;
      rays += `<polygon points="400,300 ${x - Math.sin(a) * 16},${y + Math.cos(a) * 16} ${x},${y}" fill="${i % 2 ? accent : accent2}" opacity="0.16"/>`;
    }
    return `${rays}<circle cx="400" cy="300" r="120" fill="${accent}" opacity="0.9"/><circle cx="400" cy="300" r="120" fill="url(#glow)"/>`;
  }
  if (motif === "grid") {
    let g1 = "";
    for (let i = -10; i <= 10; i++) g1 += `<line x1="400" y1="430" x2="${400 + i * 120}" y2="640" stroke="${accent}" stroke-width="2" opacity="0.5"/>`;
    for (let i = 0; i < 8; i++) { const y = 430 + i * i * 4; g1 += `<line x1="-100" y1="${y}" x2="900" y2="${y}" stroke="${accent}" stroke-width="2" opacity="${0.5 - i * 0.05}"/>`; }
    return `${g1}<circle cx="400" cy="300" r="150" fill="${g.bg2}"/><circle cx="400" cy="300" r="150" fill="url(#glow)"/><circle cx="350" cy="250" r="150" fill="${g.bg}" opacity="0.55"/>`;
  }
  if (motif === "fog") {
    let f = `<circle cx="400" cy="220" r="110" fill="${accent}" opacity="0.85"/><circle cx="400" cy="220" r="110" fill="url(#glow)"/>`;
    for (let i = 0; i < 7; i++) f += `<ellipse cx="${100 + i * 110}" cy="${380 + (i % 3) * 60}" rx="${180 + i * 18}" ry="60" fill="${accent2}" opacity="0.18"/>`;
    return f;
  }
  if (motif === "spotlight") {
    return `<polygon points="280,-40 520,-40 760,640 -40,640" fill="url(#beam)"/>
            <polygon points="400,-40 400,-40 700,640 100,640" fill="${accent}" opacity="0.05"/>
            <circle cx="400" cy="560" r="40" fill="${accent}" opacity="0.25"/>`;
  }
  if (motif === "explosion") {
    let e = "";
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, r = i % 2 ? 520 : 360;
      e += `<polygon points="400,320 ${400 + Math.cos(a - 0.06) * 70},${320 + Math.sin(a - 0.06) * 70} ${400 + Math.cos(a) * r},${320 + Math.sin(a) * r} ${400 + Math.cos(a + 0.06) * 70},${320 + Math.sin(a + 0.06) * 70}" fill="${i % 3 ? accent : accent2}" opacity="0.22"/>`;
    }
    return `${e}<circle cx="400" cy="320" r="130" fill="${accent}" opacity="0.95"/><circle cx="400" cy="320" r="130" fill="url(#glow)"/>`;
  }
  // bokeh
  let b = "";
  const cols = [accent, accent2, accent];
  for (let i = 0; i < 24; i++) {
    const x = (i * 137) % 800, y = ((i * 211) % 560) + 30, r = 18 + ((i * 53) % 70);
    b += `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i % 3]}" opacity="${0.08 + (i % 5) * 0.04}"/>`;
  }
  return b;
}

function titleMood(treatment, g) {
  const mood = String(treatment || "").toLowerCase();
  if (/(urgent|chaotic|frantic|volatile|explosive|feral|thriller|panic|crash)/.test(mood)) {
    return { stroke: g.accent2, strokeOpacity: 0.5, ruleWidth: 270, hookColor: g.accent2 };
  }
  if (/(triumphant|heroic|victorious|uplifting|epic|hopeful|glorious)/.test(mood)) {
    return { stroke: g.accent, strokeOpacity: 0.42, ruleWidth: 320, hookColor: g.accent };
  }
  if (/(mysterious|noir|ominous|shadowy|moody|brooding)/.test(mood)) {
    return { stroke: g.ink, strokeOpacity: 0.28, ruleWidth: 240, hookColor: g.ink };
  }
  return { stroke: g.accent, strokeOpacity: 0.34, ruleWidth: 290, hookColor: g.accent };
}

function heroArt(g, assets) {
  const layers = [];
  if (assets?.heroImage) {
    layers.push(`<image href="${esc(assets.heroImage)}" x="0" y="0" width="800" height="620" preserveAspectRatio="xMidYMid slice" opacity="0.96"/>`);
    layers.push(`<rect width="800" height="620" fill="url(#heroFocus)" opacity="0.16"/>`);
  } else {
    layers.push(motifArt(g));
  }
  layers.push(`<rect width="800" height="620" fill="url(#heroTint)" opacity="${assets?.heroImage ? 0.28 : 0.18}"/>`);
  return layers.join("");
}

function buildCastBilling(cast, g) {
  const entries = (cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => ({
      name: c.name.trim().toUpperCase(),
      role: c.role && c.role.trim() ? c.role.trim() : "",
    }));

  if (!entries.length) {
    return `<text x="400" y="788" text-anchor="middle" font-family="'Arial Black',Arial,sans-serif" font-weight="800" font-size="18" letter-spacing="1" fill="${g.ink}">THE ENSEMBLE CAST</text>`;
  }

  const lines = [];
  let current = [];
  let currentLen = 0;
  entries.forEach((entry) => {
    const entryLen = entry.name.length + entry.role.length + 6;
    if (current.length && currentLen + entryLen > 38) {
      lines.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(entry);
    currentLen += entryLen;
  });
  if (current.length) lines.push(current);

  return lines
    .slice(0, 3)
    .map((line, lineIdx) => {
      const parts = [];
      line.forEach((entry, entryIdx) => {
        if (entryIdx > 0) {
          parts.push(`<tspan fill="${g.ink}" opacity="0.72">  •  </tspan>`);
        }
        parts.push(`<tspan fill="${g.accent}" letter-spacing="1.3">${esc(entry.name)}</tspan>`);
        if (entry.role) {
          parts.push(`<tspan fill="${g.ink}" opacity="0.9"> — ${esc(entry.role)}</tspan>`);
        }
      });
      return `<text x="400" y="${778 + lineIdx * 28}" text-anchor="middle" font-family="'Arial Black',Arial,sans-serif" font-weight="800" font-size="18" letter-spacing="0.8">${parts.join("")}</text>`;
    })
    .join("");
}

/* ---------- the poster (pure SVG string -> reliable PNG export) ---------- */
export function buildPoster(f, ai = {}, assets = {}) {
  const g = GENRES[f.genre] || GENRES.drama;
  const W = 800, H = 1240;
  const concept = ai.concept || {};

  const title = (f.title || "Untitled Sprint").toUpperCase();
  const tSize = title.length > 22 ? 60 : title.length > 14 ? 78 : 96;
  const tLines = wrap(title, Math.floor(720 / (tSize * 0.56)), 2);
  const mood = titleMood(concept.titleTreatment, g);

  const tagline = f.tagline || ai.tagline || "Every sprint tells a story.";
  const taglineLines = wrap(tagline, 46, 2);
  const hook = (concept.posterHook || tagline).toUpperCase();
  const hookLines = wrap(hook, 32, 2);
  const quotes = (ai.criticQuotes || []).slice(0, 3);
  const hasHeroImage = !!assets?.heroImage;

  const castNames = (f.cast || []).filter((c) => c.name.trim());
  const castSvg = buildCastBilling(castNames, g);
  const sceneSetter = wrap(concept.visualConcept || "A team epic cut from sprint pressure and late-stage heroics.", 26, 4);

  const notes = [
    { k: "▲  THE CONFLICT", v: f.conflict, c: g.accent2, label: "what tested us" },
    { k: "★  THE TRIUMPHS", v: f.climax, c: g.accent, label: "what we nailed" },
    { k: "⟳  POST-CREDITS SCENE", v: f.postCredits, c: g.accent, label: "the one thing we carry forward", hot: true },
  ];

  const NOTE_TOP = 860;
  let notesSvg = "";
  notes.forEach((n, i) => {
    const y = NOTE_TOP + i * 104;
    const vLines = wrap(n.v || "—", 64, 3);
    if (n.hot)
      notesSvg += `<rect x="44" y="${y - 18}" width="712" height="86" rx="10" fill="${g.accent}" opacity="0.10"/>
                   <rect x="44" y="${y - 18}" width="6" height="86" rx="3" fill="${g.accent}"/>`;
    notesSvg += `<text x="${n.hot ? 64 : 48}" y="${y}" font-family="'Courier New',monospace" font-size="17" font-weight="700" letter-spacing="1.5" fill="${n.c}">${esc(n.k)}<tspan font-weight="400" fill="${g.ink}" opacity="0.4" font-size="12"> — ${esc(n.label)}</tspan></text>
      <text x="${n.hot ? 64 : 48}" y="${y + 26}" font-family="'Courier New',monospace" font-size="15" fill="${g.ink}" opacity="0.92">${tspans(vLines, n.hot ? 64 : 48, 21)}</text>`;
  });

  let quoteSvg = "";
  quotes.forEach((q, i) => {
    const y = 74 + i * 40;
    const ql = wrap(`"${q.quote}"  — ${q.source}`, 64, 1);
    quoteSvg += `<text x="400" y="${y}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="16" fill="${g.ink}" opacity="0.85">${esc(ql[0])}</text>`;
  });

  const sceneBox = hasHeroImage
    ? ""
    : `<g>
    <rect x="504" y="188" width="244" height="148" rx="16" fill="${g.bg}" fill-opacity="0.54" stroke="${g.accent}" stroke-opacity="0.22"/>
    <text x="528" y="218" font-family="'Courier New',monospace" font-size="11" letter-spacing="1.8" fill="${g.accent}" opacity="0.95">SCENE SETTER</text>
    <text x="528" y="244" font-family="Georgia,serif" font-size="17" font-style="italic" fill="${g.ink}" opacity="0.92">${tspans(sceneSetter, 528, 21)}</text>
  </g>`;

  const stars = "★★★★★";
  const billing = wrap(ai.billingBlock || "", 118, 3);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial,sans-serif">
  <defs>
    <clipPath id="artClip"><rect x="0" y="0" width="${W}" height="620"/></clipPath>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${g.bg2}"/><stop offset="0.55" stop-color="${g.bg}"/><stop offset="1" stop-color="#000"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.accent}" stop-opacity="0.32"/><stop offset="1" stop-color="${g.accent}" stop-opacity="0"/></linearGradient>
    <linearGradient id="heroTint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.bg2}" stop-opacity="0.18"/><stop offset="1" stop-color="${g.bg}" stop-opacity="0.65"/></linearGradient>
    <radialGradient id="heroFocus" cx="0.5" cy="0.34" r="0.72"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.42"/></radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.bg}" stop-opacity="0"/><stop offset="0.7" stop-color="${g.bg}" stop-opacity="0.85"/><stop offset="1" stop-color="${g.bg}" stop-opacity="1"/></linearGradient>
    <radialGradient id="titlePlate" cx="0.5" cy="0.52" r="0.38"><stop offset="0" stop-color="${g.bg}" stop-opacity="0.96"/><stop offset="0.65" stop-color="${g.bg}" stop-opacity="0.78"/><stop offset="1" stop-color="${g.bg}" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer></filter>
    <filter id="titleShadow"><feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000" flood-opacity="0.42"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <g clip-path="url(#artClip)">${heroArt(g, assets)}</g>
  <rect x="0" y="300" width="${W}" height="420" fill="url(#scrim)"/>
  <ellipse cx="400" cy="585" rx="330" ry="165" fill="url(#titlePlate)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>

  <text x="400" y="40" text-anchor="middle" font-family="'Courier New',monospace" font-size="12" letter-spacing="4" fill="${g.accent}" opacity="0.9">OFFICIAL SELECTION · CORE BLUE STUDIOS STORY DEPT</text>
  ${quoteSvg}
  ${sceneBox}

  <text x="400" y="${626 - (tLines.length - 1) * tSize * 0.5}" text-anchor="middle" font-family="'Arial Black','Arial',sans-serif" font-weight="900" font-size="${tSize}" letter-spacing="-1" fill="none" stroke="${mood.stroke}" stroke-width="2.5" stroke-opacity="${mood.strokeOpacity}">${tspans(tLines, 400, tSize * 1.0)}</text>
  <text x="400" y="${626 - (tLines.length - 1) * tSize * 0.5}" text-anchor="middle" font-family="'Arial Black','Arial',sans-serif" font-weight="900" font-size="${tSize}" letter-spacing="-1" fill="${g.ink}" filter="url(#titleShadow)">${tspans(tLines, 400, tSize * 1.0)}</text>
  <rect x="${400 - mood.ruleWidth / 2}" y="656" width="${mood.ruleWidth}" height="4" fill="${g.accent}"/>

  <text x="400" y="700" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="22" fill="${g.accent}">${tspans(taglineLines, 400, 24)}</text>

  <text x="400" y="746" text-anchor="middle" font-family="'Courier New',monospace" font-size="13" letter-spacing="3" fill="${g.ink}" opacity="0.55">STARRING</text>
  ${castSvg}

  <line x1="44" y1="824" x2="756" y2="824" stroke="${g.ink}" stroke-opacity="0.18"/>
  ${notesSvg}

  <text x="400" y="1180" text-anchor="middle" font-family="'Arial Narrow',Arial,sans-serif" font-size="11" fill="${g.ink}" opacity="0.55" letter-spacing="0.3">${tspans(billing.length && billing[0] ? billing : [""], 400, 14)}</text>
  <text x="400" y="1226" text-anchor="middle" font-family="'Courier New',monospace" font-size="12" letter-spacing="2" fill="${g.accent}">${esc(g.label.toUpperCase())} · ${esc((ai.rating || "RATED S").toUpperCase())} · ${esc(ai.runtime || "ONE SPRINT")}</text>

  <g font-family="'Arial Black',Arial,sans-serif">
    <rect x="44" y="58" width="86" height="40" rx="4" fill="none" stroke="${g.ink}" stroke-opacity="0.5"/>
    <text x="87" y="84" text-anchor="middle" font-size="20" font-weight="900" fill="${g.ink}">${esc((ai.rating || "S").replace(/rated\s*/i, "").trim().slice(0, 5) || "S")}</text>
    <text x="756" y="80" text-anchor="end" font-size="20" fill="${g.accent}">${stars}</text>
    <text x="756" y="98" text-anchor="end" font-family="'Courier New',monospace" font-size="10" letter-spacing="1" fill="${g.ink}" opacity="0.6">${esc(ai.runtime || "ONE SPRINT")}</text>
  </g>
</svg>`;
}
