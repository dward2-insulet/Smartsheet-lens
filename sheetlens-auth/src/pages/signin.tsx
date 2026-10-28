import { startSignIn } from "@/lib/smartsheet-auth";
import { Layers } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Layers className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to SheetLens</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your Smartsheet account to see projects, tasks, and requests tailored to your role.
        </p>
        <button
          onClick={startSignIn}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
        >
          Sign in with Smartsheet
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground">
          You'll only see sheets you already have access to in Smartsheet.
        </p>
      </div>
    </div>
  );
}