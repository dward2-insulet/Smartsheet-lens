// Relay the current-user read through Vercel to avoid browser CORS restrictions.
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

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const upstream = await fetch("https://api.smartsheet.com/2.0/users/me", {
      headers: { Authorization: authorization },
    });
    const body = await upstream.text();
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json",
    );
    return res.status(upstream.status).send(body);
  } catch (error) {
    console.error("Smartsheet user relay failed.", error);
    return res.status(502).json({ error: "Could not reach Smartsheet." });
  }
}
