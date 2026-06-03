// Genre design system. Add a new genre by adding an entry here — `motif`
// must be one of: sunburst | grid | fog | spotlight | explosion | bokeh
// (see motifArt() in poster.js). Everything else is driven by these colors.
export const GENRES = {
  epic:     { label: "Epic Adventure",     emoji: "🗺️", motif: "sunburst",  bg: "#0b1f2a", bg2: "#163a44", accent: "#f4c542", accent2: "#e8853a", ink: "#fff7e6" },
  scifi:    { label: "Sci-Fi",             emoji: "🛸", motif: "grid",      bg: "#060812", bg2: "#0e1233", accent: "#45e0ff", accent2: "#ff49c6", ink: "#eaf6ff" },
  horror:   { label: "Horror",             emoji: "🔪", motif: "fog",       bg: "#0a0608", bg2: "#1c0a0d", accent: "#cf2230", accent2: "#7a1116", ink: "#f3e6e6" },
  heist:    { label: "Heist / Thriller",   emoji: "💎", motif: "spotlight", bg: "#100d07", bg2: "#241c0d", accent: "#e3bd57", accent2: "#9c7b27", ink: "#f6efd9" },
  comedy:   { label: "Comedy",             emoji: "🎭", motif: "bokeh",     bg: "#1a1206", bg2: "#3a2708", accent: "#ffb13d", accent2: "#ff6a8a", ink: "#fff3df" },
  action:   { label: "Action Blockbuster", emoji: "💥", motif: "explosion", bg: "#08131a", bg2: "#0c2a30", accent: "#ff6a1f", accent2: "#28c2d6", ink: "#eafaff" },
  noir:     { label: "Noir / Mystery",     emoji: "🕵️", motif: "spotlight", bg: "#0c0c0d", bg2: "#1c1c1f", accent: "#e9e9ec", accent2: "#8a8a90", ink: "#f2f2f4" },
  romance:  { label: "Romance",            emoji: "💘", motif: "bokeh",     bg: "#240b18", bg2: "#3d1228", accent: "#ff7fa3", accent2: "#ffd27f", ink: "#ffe9f0" },
  disaster: { label: "Disaster Movie",     emoji: "🌪️", motif: "explosion", bg: "#131210", bg2: "#2a2118", accent: "#ff5b2e", accent2: "#ffb84d", ink: "#fff0e6" },
  drama:    { label: "Prestige Drama",     emoji: "🏆", motif: "spotlight", bg: "#131210", bg2: "#26231b", accent: "#cdb57e", accent2: "#7d7256", ink: "#f5efe2" },
};
