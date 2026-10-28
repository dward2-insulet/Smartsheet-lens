import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleCallback } from "../lib/smartsheet-auth";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (oauthError) {
      setError(`Smartsheet denied the request: ${oauthError}`);
      return;
    }
    if (!code || !state) {
      setError("Missing OAuth response parameters.");
      return;
    }

    handleCallback(code, state)
      .then(() => navigate("/", { replace: true }))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Sign-in failed."),
      );
  }, [code, navigate, oauthError, state]);

  return (
    <main className="callback-page">
      <section className="callback-card">
        {error ? (
          <>
            <h1 className="error-title">Sign-in failed</h1>
            <p className="muted">{error}</p>
            <a href="/signin" className="text-link">Try again</a>
          </>
        ) : (
          <>
            <div className="spinner" />
            <h1>Finishing sign-in…</h1>
            <p className="muted">Hold tight.</p>
          </>
        )}
      </section>
    </main>
  );
}