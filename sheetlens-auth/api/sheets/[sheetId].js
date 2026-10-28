// Relay sheet reads through Vercel so browsers do not call Smartsheet cross-origin.
export default async function handler(req, res) {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.SHEETLENS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization");
  } else if (origin) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const sheetId = req.query.sheetId;
  if (typeof sheetId !== "string" || !/^\d+$/.test(sheetId)) {
    return res.status(400).json({ error: "Invalid sheet ID." });
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const url = new URL(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}`,
    );
    url.searchParams.set("include", "objectValue");
    url.searchParams.set("level", "1");
    url.searchParams.set("pageSize", "5000");

    const upstream = await fetch(url, {
      headers: { Authorization: authorization },
    });
    const body = await upstream.text();
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json",
    );
    return res.status(upstream.status).send(body);
  } catch (error) {
    console.error("Smartsheet sheet relay failed.", error);
    return res.status(502).json({ error: "Could not reach Smartsheet." });
  }
}
