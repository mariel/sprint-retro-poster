// Vercel serverless function. Any file in /api becomes an endpoint:
// this one handles POST /api/generate. On Vercel the Express server
// (server.js) is NOT used — this function is the backend.
import { generateFlavor } from "../lib/generate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const ai = await generateFlavor(body.fields || {});
    res.status(200).json({ ai });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message, detail: e.detail });
  }
}
