import type { PropsWithChildren } from "react";
import { RoleProvider } from "@/lib/role-context";
import { isSignedIn } from "@/lib/smartsheet-auth";
import { Navigate, useLocation } from "react-router-dom";

export function AppProviders({ children }: PropsWithChildren) {
  const location = useLocation();
  const signedIn = isSignedIn();

  // Allow the signin and oauth routes through without auth
  const publicPath =
    location.pathname === "/signin" ||
    location.pathname.startsWith("/oauth/callback");

  if (!signedIn && !publicPath) {
    return <Navigate to="/signin" replace />;
  }
  return <RoleProvider>{children}</RoleProvider>;
}