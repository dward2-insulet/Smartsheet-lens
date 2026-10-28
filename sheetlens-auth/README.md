# SheetLens

SheetLens is a Vite/React prototype for signing in to Smartsheet and browsing four configured registers. The current UI is read-only.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.
4. In the Smartsheet OAuth app, register the exact callback URL shown by the app (for example, `http://localhost:5173/oauth/callback`).

The browser app uses the token-exchange and Smartsheet read-relay functions configured in `src/lib/config.ts`. Those functions must be deployed to the configured Vercel project. The token exchange function must have `SMARTSHEET_CLIENT_ID` and `SMARTSHEET_CLIENT_SECRET` configured as server-side environment variables. Add any deployed frontend origin(s), comma-separated, to `SHEETLENS_ALLOWED_ORIGINS`; local Vite origins on ports 5173 and 3000 are allowed by default. Sheet reads go through `/api/sheets/:sheetId` and `/api/users/me` so the browser does not call Smartsheet cross-origin.

## Verify

- `npm run build` type-checks and creates the production frontend in `dist/`.
- The four sheet IDs and requested OAuth scopes are in `src/lib/config.ts`.
- The OAuth callback URL must also be registered in the Smartsheet developer portal. A deployed app's origin must be allowed by the token endpoint's CORS configuration.

This prototype does not yet include role-based views, search/filtering, write actions, or automated tests. The OAuth token is stored in browser local storage; review that security choice before production use.
