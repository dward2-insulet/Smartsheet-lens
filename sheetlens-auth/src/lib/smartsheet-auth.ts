/**
 * Smartsheet OAuth flow + token storage.
 * - startSignIn()      → redirects user to Smartsheet to authorize
 * - handleCallback()   → called on /oauth/callback, swaps code for token
 * - getAccessToken()   → returns the current token (refreshes if expired)
 * - signOut()          → clears local token
 * - isSignedIn()       → quick check for UI
 */
import { SMARTSHEET_CONFIG } from "./config";

const STORAGE_KEY = "sl.smartsheet.token";

interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms epoch
}

function loadToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const token: unknown = JSON.parse(raw);
    if (
      typeof token === "object" &&
      token !== null &&
      "access_token" in token &&
      typeof token.access_token === "string" &&
      "refresh_token" in token &&
      typeof token.refresh_token === "string" &&
      "expires_at" in token &&
      typeof token.expires_at === "number"
    ) {
      return token as StoredToken;
    }
  } catch (error) {
    console.error("Could not read the saved Smartsheet token.", error);
  }
  return null;
}

function saveToken(t: StoredToken) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}
function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSignedIn(): boolean {
  return loadToken() !== null;
}

export function signOut() {
  clearToken();
  window.location.href = "/signin";
}

export function startSignIn() {
  const randomState = crypto.getRandomValues(new Uint8Array(32));
  const state = Array.from(randomState, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  sessionStorage.setItem("sl.oauth.state", state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SMARTSHEET_CONFIG.clientId,
    scope: SMARTSHEET_CONFIG.scope,
    redirect_uri: SMARTSHEET_CONFIG.redirectUri,
    state,
  });

  window.location.href =
    `https://app.smartsheet.com/b/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

function validateTokenResponse(data: unknown): data is TokenResponse & { access_token: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    typeof data.access_token === "string" &&
    data.access_token.length > 0
  );
}

export async function handleCallback(code: string, state: string): Promise<void> {
  const expected = sessionStorage.getItem("sl.oauth.state");
  if (!expected || expected !== state) {
    throw new Error("OAuth state mismatch — possible CSRF, aborting.");
  }
  sessionStorage.removeItem("sl.oauth.state");

  const r = await fetch(SMARTSHEET_CONFIG.tokenExchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, grant_type: "authorization_code" }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data: unknown = await r.json();
  if (!validateTokenResponse(data) || !data.refresh_token) {
    throw new Error("Token exchange returned an invalid token response.");
  }
  saveToken({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 604_800) * 1000,
  });
}

async function refresh(): Promise<string> {
  const t = loadToken();
  if (!t) throw new Error("Not signed in");
  const r = await fetch(SMARTSHEET_CONFIG.tokenExchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: t.refresh_token,
    }),
  });
  if (!r.ok) {
    clearToken();
    throw new Error("Token refresh failed; please sign in again.");
  }
  const data: unknown = await r.json();
  if (!validateTokenResponse(data)) {
    clearToken();
    throw new Error("Token refresh returned an invalid token response.");
  }
  saveToken({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? t.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 604_800) * 1000,
  });
  return data.access_token;
}

export async function getAccessToken(): Promise<string> {
  const t = loadToken();
  if (!t) throw new Error("Not signed in");
  if (Date.now() > t.expires_at - 60_000) return refresh();
  return t.access_token;
}