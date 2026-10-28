/**
 * Smartsheet OAuth flow + token storage.
 * - startSignIn()      → redirects user to Smartsheet to authorize
 * - handleCallback()   → called on /oauth/callback, swaps code for token
 * - getAccessToken()   → returns the current token (refreshes if expired)
 * - signOut()          → clears local token
 * - isSignedIn()       → quick check for UI
 */
import { SMARTSHEET_CONFIG } from "./sheetlens-config";

const STORAGE_KEY = "sl.smartsheet.token";

interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms epoch
}

function loadToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
  window.location.href = "/";
}

export function startSignIn() {
  // Random state to protect against CSRF.
  const state = Math.random().toString(36).slice(2);
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
  const data = await r.json();
  // Smartsheet returns: { access_token, refresh_token, expires_in (seconds), token_type }
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
  const data = await r.json();
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
  // Refresh 1 minute before expiry.
  if (Date.now() > t.expires_at - 60_000) return refresh();
  return t.access_token;
}