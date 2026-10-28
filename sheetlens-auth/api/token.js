// Exchanges a Smartsheet OAuth `code` for an access token.
// The client_secret stays server-side — never shipped to the browser.

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
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code, grant_type, refresh_token } = req.body || {};
  const grantType = grant_type || "authorization_code";
  if (
    (grantType !== "authorization_code" && grantType !== "refresh_token") ||
    (grantType === "authorization_code" && typeof code !== "string") ||
    (grantType === "refresh_token" && typeof refresh_token !== "string")
  ) {
    return res.status(400).json({ error: "Invalid token request." });
  }

  const clientId = process.env.SMARTSHEET_CLIENT_ID;
  const clientSecret = process.env.SMARTSHEET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Server not configured: missing client ID or secret." });
  }

  // Smartsheet requires a SHA-256 hash of (client_secret + "|" + code-or-refresh-token).
  const params = new URLSearchParams({
    grant_type: grantType,
    client_id: clientId,
  });
  if (grantType === "refresh_token") {
    params.set("refresh_token", refresh_token);
  } else {
    params.set("code", code);
  }

  try {
    const toHash = `${clientSecret}|${grantType === "refresh_token" ? refresh_token : code}`;
    params.set("hash", await sha256(toHash));
    const r = await fetch("https://api.smartsheet.com/2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Token exchange failed", detail: String(err) });
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}