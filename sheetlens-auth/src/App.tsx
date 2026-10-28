import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProviders } from "./components/system/AppProviders";
import HomePage from "./pages";
import OAuthCallbackPage from "./pages/oauth-callback";
import SignInPage from "./pages/signin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route element={<AppProviders />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
