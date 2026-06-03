import React, { useState, useRef } from "react";
import { GENRES } from "./genres.js";
import { buildPoster } from "./poster.js";

/* AI fallback so the poster always renders, even if the API call fails. */
function castBilling(f) {
  const cast = (f.cast || [])
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => c.name.trim() + (c.role && c.role.trim() ? ` (${c.role.trim()})` : ""))
    .join(" • ");
  return cast || "The ensemble cast";
}

function fallbackPosterPayload(f) {
  return {
    ai: {
      tagline: f.tagline || "Two weeks. One team. No do-overs.",
      criticQuotes: [
        { quote: "A standup triumph.", source: "The Daily Standup" },
        { quote: "You'll laugh, you'll refactor.", source: "Velocity Weekly" },
      ],
      rating: "Rated S (for shipping drama)",
      runtime: "2 Weeks · One Sprint",
      billingBlock:
        "CORE BLUE STUDIOS presents " +
        (f.title || "A SPRINT") +
        " - produced by the team, for the team, with zero calm standups and maximum delivery drama.",
      concept: {
        posterHook: f.tagline || "One sprint. One deadline. No clean takes.",
        titleTreatment: "bold, high-stakes, midnight-blue blockbuster",
        castBilling: castBilling(f),
        visualConcept: `A cinematic ${f.genre || "drama"} team poster about ${f.conflict || "mounting sprint pressure"} transforming into ${f.climax || "a hard-won team victory"}.`,
        highlightMoments: [
          f.conflict || "Act II pressure spike",
          f.climax || "Impossible ship lands",
          f.postCredits || "Sequel sets a better habit",
        ],
        artPrompt: `Cinematic portrait movie poster key art for "${f.title || "Untitled Sprint"}" with ${castBilling(f)} navigating ${f.conflict || "a tense sprint obstacle"} and emerging into ${f.climax || "a hard-won team victory"}.`,
      },
    },
    assets: {},
  };
}

function mergePosterPayload(base, incoming) {
  const next = incoming && typeof incoming === "object" ? incoming : {};
  const nextAI = next.ai && typeof next.ai === "object" ? next.ai : {};
  const nextConcept = nextAI.concept && typeof nextAI.concept === "object" ? nextAI.concept : {};

  return {
    ai: {
      ...base.ai,
      ...nextAI,
      criticQuotes: Array.isArray(nextAI.criticQuotes) && nextAI.criticQuotes.length ? nextAI.criticQuotes : base.ai.criticQuotes,
      concept: {
        ...base.ai.concept,
        ...nextConcept,
        highlightMoments:
          Array.isArray(nextConcept.highlightMoments) && nextConcept.highlightMoments.length
            ? nextConcept.highlightMoments
            : base.ai.concept.highlightMoments,
      },
    },
    assets: {
      ...base.assets,
      ...(next.assets && typeof next.assets === "object" ? next.assets : {}),
    },
  };
}

const blankCast = () => ({ name: "", role: "" });

export default function App() {
  const [step, setStep] = useState("form");
  const [err, setErr] = useState("");
  const [poster, setPoster] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [f, setF] = useState({
    title: "", tagline: "", genre: "action",
    cast: [blankCast(), blankCast()],
    conflict: "", climax: "", postCredits: "",
  });
  const svgRef = useRef(null);

  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const upCast = (i, k, v) => setF((s) => { const c = [...s.cast]; c[i] = { ...c[i], [k]: v }; return { ...s, cast: c }; });
  const addCast = () => setF((s) => ({ ...s, cast: [...s.cast, blankCast()] }));
  const rmCast = (i) => setF((s) => ({ ...s, cast: s.cast.filter((_, j) => j !== i) }));

  async function generate() {
    if (!f.title.trim()) { setErr("Give your sprint a title — every movie needs one."); return; }
    setErr(""); setStep("generating");
    const msgs = ["Casting the leads…", "Blocking the hero shot…", "Punching up the campaign copy…", "Printing the one-sheet…"];
    let mi = 0; setLoadingMsg(msgs[0]);
    const ticker = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadingMsg(msgs[mi]); }, 1400);

    let posterData = fallbackPosterPayload(f);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: f }),
      });
      if (res.ok) {
        const data = await res.json();
        posterData = mergePosterPayload(posterData, data);
      }
    } catch (e) {
      // keep fallback; poster still renders
    } finally {
      clearInterval(ticker);
    }
    setPoster(buildPoster(f, posterData.ai, posterData.assets));
    setStep("poster");
  }

  function download() {
    const svg = svgRef.current ? svgRef.current.innerHTML : poster;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const s = 2, c = document.createElement("canvas");
      c.width = 800 * s; c.height = 1240 * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = (f.title || "sprint-retro").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + "-poster.png";
      a.href = c.toDataURL("image/png");
      a.click();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErr("Poster export failed. Try generating it one more time.");
    };
    img.src = url;
  }

  const S = {
    wrap: { minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -10%, #173a72, #0a1222 58%, #060b15 100%)", color: "#ecf4ff", fontFamily: "'Archivo','Segoe UI',sans-serif", padding: "28px 18px 60px" },
    shell: { maxWidth: 1040, margin: "0 auto" },
    kicker: { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: 4, color: "#7fc4ff", textTransform: "uppercase" },
    h1: { fontFamily: "'Arial Black',sans-serif", fontWeight: 900, fontSize: 44, lineHeight: 1, margin: "6px 0 4px", letterSpacing: -1 },
    sub: { color: "#98aeca", fontSize: 15, maxWidth: 620, lineHeight: 1.5 },
    card: { background: "rgba(18,34,62,0.78)", border: "1px solid rgba(116,170,255,0.16)", borderRadius: 16, padding: 22, marginTop: 18, boxShadow: "0 18px 50px rgba(0,0,0,0.24)" },
    label: { fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#c4ddff", display: "block", marginBottom: 7 },
    hint: { color: "#7e9ac1", fontWeight: 400, textTransform: "none", letterSpacing: 0 },
    input: { width: "100%", background: "rgba(5,12,25,0.55)", border: "1px solid rgba(116,170,255,0.18)", borderRadius: 9, color: "#fff", padding: "11px 13px", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    field: { marginBottom: 16 },
    genreGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 9 },
    chip: (on) => ({ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 600, border: on ? "1px solid #63afff" : "1px solid rgba(116,170,255,0.14)", background: on ? "linear-gradient(180deg,rgba(56,126,214,0.32),rgba(22,72,140,0.38))" : "rgba(8,19,38,0.65)", color: on ? "#eef7ff" : "#d1e2fb", transition: "all .15s" }),
    castRow: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 9, marginBottom: 9, alignItems: "center" },
    iconBtn: { background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,90,90,0.3)", color: "#ff9f9f", borderRadius: 8, width: 40, height: 40, cursor: "pointer", fontSize: 18 },
    ghost: { background: "rgba(9,23,46,0.5)", border: "1px dashed rgba(116,170,255,0.28)", color: "#d1e2fb", borderRadius: 9, padding: "9px 14px", cursor: "pointer", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" },
    cta: { width: "100%", marginTop: 20, padding: "16px", fontSize: 17, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", letterSpacing: 1, color: "#f3f9ff", background: "linear-gradient(180deg,#5bb1ff,#2467d9)", border: "none", borderRadius: 12, cursor: "pointer", boxShadow: "0 10px 30px rgba(36,103,217,0.32)" },
    errBox: { color: "#ffadad", fontSize: 13, marginTop: 10, fontFamily: "'JetBrains Mono',monospace" },
    btn: { padding: "12px 20px", fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "1px solid rgba(116,170,255,0.2)", background: "rgba(14,31,58,0.82)", color: "#eef7ff", fontFamily: "inherit" },
    btnGold: { padding: "12px 22px", fontSize: 14, fontWeight: 800, borderRadius: 10, cursor: "pointer", border: "none", background: "linear-gradient(180deg,#5bb1ff,#2467d9)", color: "#f3f9ff" },
  };

  return (
    <div style={S.wrap}>
      <style dangerouslySetInnerHTML={{ __html: "*::placeholder{color:#6f88ad} input:focus{border-color:#63afff!important;box-shadow:0 0 0 1px rgba(99,175,255,0.2)} @keyframes spin{to{transform:rotate(360deg)}}" }} />
      <div style={S.shell}>
        <div style={S.kicker}>🎬 Core Blue Studios</div>
        <h1 style={S.h1}>Sprint 11 Retro: The Movie</h1>
        <p style={S.sub}>Turn your retrospective into a movie poster. Fill the studio sheet, and the AI shapes the campaign copy, story beats, and hero shot into a poster you can drop in the team channel.</p>

        {step === "form" && (
          <>
            <div style={S.card}>
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>Title <span style={S.hint}>· the sprint name / theme</span></label>
                  <input style={S.input} value={f.title} placeholder="e.g. The Last Deploy" onChange={(e) => up("title", e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Tagline <span style={S.hint}>· one-line summary (AI can punch it up)</span></label>
                  <input style={S.input} value={f.tagline} placeholder="e.g. They shipped against all odds." onChange={(e) => up("tagline", e.target.value)} />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Genre <span style={S.hint}>· the vibe of this sprint — sets the whole poster look</span></label>
                <div style={S.genreGrid}>
                  {Object.entries(GENRES).map(([k, v]) => (
                    <div key={k} style={S.chip(f.genre === k)} onClick={() => up("genre", k)}>
                      <span style={{ fontSize: 18 }}>{v.emoji}</span>{v.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={S.card}>
              <label style={S.label}>Cast <span style={S.hint}>· shout out who you worked with this sprint</span></label>
              {f.cast.map((c, i) => (
                <div key={i} style={S.castRow}>
                  <input style={S.input} value={c.name} placeholder={i === 0 ? "your name" : "name"} onChange={(e) => upCast(i, "name", e.target.value)} />
                  <input style={S.input} value={c.role} placeholder={i === 0 ? "role / what you crushed (optional)" : "role / what they crushed (optional)"} onChange={(e) => upCast(i, "role", e.target.value)} />
                  <button style={S.iconBtn} onClick={() => rmCast(i)} title="Remove">×</button>
                </div>
              ))}
              <button style={S.ghost} onClick={addCast}>+ add cast member</button>
            </div>

            <div style={S.card}>
              <div style={S.field}>
                <label style={S.label}>The Conflict <span style={S.hint}>· what didn't go well</span></label>
                <input style={S.input} value={f.conflict} placeholder="e.g. bubblebot turned on me" onChange={(e) => up("conflict", e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>The Triumphs <span style={S.hint}>· what went well</span></label>
                <input style={S.input} value={f.climax} placeholder="e.g. 100% code coverage" onChange={(e) => up("climax", e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Post-Credits Scene <span style={S.hint}>· something to improve for next sprint</span></label>
                <input style={S.input} value={f.postCredits} placeholder="e.g. better vibes" onChange={(e) => up("postCredits", e.target.value)} />
              </div>
            </div>

            {err && <div style={S.errBox}>⚠ {err}</div>}
            <button style={S.cta} onClick={generate}>🎬 ROLL CAMERA — GENERATE POSTER</button>
          </>
        )}

        {step === "generating" && (
          <div style={{ textAlign: "center", padding: "90px 0" }}>
            <div style={{ fontSize: 52, animation: "spin 1.4s linear infinite", display: "inline-block" }}>🎞️</div>
            <div style={{ marginTop: 18, fontFamily: "'JetBrains Mono',monospace", color: "#7fc4ff", letterSpacing: 1 }}>{loadingMsg}</div>
          </div>
        )}

        {step === "poster" && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <button style={S.btnGold} onClick={download}>⬇ Download poster (PNG)</button>
              <button style={S.btn} onClick={() => setStep("form")}>← Edit details</button>
              <button style={S.btn} onClick={() => { setF({ title: "", tagline: "", genre: "action", cast: [blankCast(), blankCast()], conflict: "", climax: "", postCredits: "" }); setStep("form"); }}>＋ New retro</button>
            </div>
            <div style={{ maxWidth: 560, margin: "0 auto", borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div ref={svgRef} style={{ display: "block", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: poster.replace("<svg ", '<svg style="width:100%;height:auto;display:block" ') }} />
            </div>
            <p style={{ textAlign: "center", color: "#7d7690", fontSize: 12, marginTop: 12, fontFamily: "'JetBrains Mono',monospace" }}>Tip: drop the PNG in your retro channel to kick off discussion 🍿</p>
          </div>
        )}
      </div>
    </div>
  );
}
