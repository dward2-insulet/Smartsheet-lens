import { isSignedIn } from "../../lib/smartsheet-auth";
import { Navigate, Outlet } from "react-router-dom";

export function AppProviders() {
  if (!isSignedIn()) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}