import SignInPage from "./pages/signin";
import OAuthCallbackPage from "./pages/oauth-callback";
<Route path="/signin" element={<SignInPage />} />
<Route path="/oauth/callback" element={<OAuthCallbackPage />} />