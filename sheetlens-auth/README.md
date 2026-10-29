# SheetLens

SheetLens is a Vite/React app for signing in to Smartsheet. The first role-based view is a read-only contributor task list: the API matches the signed-in email to the People register, requires the `Contributor` flag, and returns tasks whose `Driver` contact contains that email.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.
4. In the Smartsheet OAuth app, register the exact callback URL shown by the app (for example, `http://localhost:5173/oauth/callback`).

The browser app uses the token-exchange and contributor-task functions configured in `src/lib/config.ts`. Those functions must be deployed to the configured Vercel project. The token exchange function must have `SMARTSHEET_CLIENT_ID` and `SMARTSHEET_CLIENT_SECRET` configured as server-side environment variables. Add any deployed frontend origin(s), comma-separated, to `SHEETLENS_ALLOWED_ORIGINS`; local Vite origins on ports 5173 and 3000 are allowed by default. The `/api/my-tasks` endpoint checks the Smartsheet user, People role, and Driver assignments server-side and returns only the seven configured task columns for matching tasks.

## Verify

- `npm run build` type-checks and creates the production frontend in `dist/`.
- Sheet IDs and exact register column names are in `src/lib/smartsheet-registers.js`.
- The OAuth callback URL must also be registered in the Smartsheet developer portal. A deployed app's origin must be allowed by the token endpoint's CORS configuration.

This contributor view is intentionally read-only. Status, Contributor(s), and Due Date editing should be added only after the email/role/Driver matching is verified against live data. The OAuth token is stored in browser local storage; review that security choice before production use.
