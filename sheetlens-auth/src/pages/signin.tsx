import { startSignIn } from "../lib/smartsheet-auth";
import { Layers } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="signin-page">
      <section className="signin-card">
        <div className="brand-mark">
          <Layers className="size-6" />
        </div>
        <h1>Welcome to SheetLens</h1>
        <p className="muted">
          Sign in with your Smartsheet account to see projects, tasks, and requests tailored to your role.
        </p>
        <button onClick={startSignIn} className="button button-primary signin-button">
          Sign in with Smartsheet
        </button>
        <p className="muted small-note">
          You'll only see sheets you already have access to in Smartsheet.
        </p>
      </section>
    </main>
  );
}