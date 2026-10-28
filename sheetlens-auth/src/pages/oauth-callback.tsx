import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleCallback } from "@/lib/smartsheet-auth";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");
    if (err) { setError(`Smartsheet denied the request: ${err}`); return; }
    if (!code || !state) { setError("Missing OAuth response parameters."); return; }

    handleCallback(code, state)
      .then(() => navigate("/", { replace: true }))
      .catch((e) => setError(e.message || "Sign-in failed."));
  }, [params, navigate]);

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border bg-card p-6 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-rose-700">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <a href="/signin" className="mt-4 inline-block text-sm text-primary hover:underline">Try again</a>
          </>
        ) : (
          <>
            <div className="animate-pulse size-8 bg-primary/20 rounded-full mx-auto" />
            <h1 className="mt-3 text-lg font-semibold">Finishing sign-in…</h1>
            <p className="text-sm text-muted-foreground mt-1">Hold tight.</p>
          </>
        )}
      </div>
    </div>
  );
}