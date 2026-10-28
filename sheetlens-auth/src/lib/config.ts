/**
 * SheetLens runtime config. These are the only values you should ever need to
 * tweak when moving between environments (local dev, staging, production).
 */
export const SMARTSHEET_CONFIG = {
  // From the Smartsheet Developer portal
  clientId: "5xr22whfeny2rry8uah",

  // Your deployed Vercel token-exchange endpoint
  tokenExchangeUrl: "https://sheetlens-auth-insulet2.vercel.app/api/token",

  // Where Smartsheet redirects back to after sign-in. MUST exactly match
  // one of the redirect URIs registered on your Smartsheet OAuth app.
  // For local dev this is localhost; for deployed, your deployed URL.
  redirectUri:
    typeof window !== "undefined"
      ? `${window.location.origin}/oauth/callback`
      : "http://localhost:5173/oauth/callback",

  // Permissions SheetLens asks for. READ_SHEETS is enough to pull the registers.
  // Add WRITE_SHEET if/when you want to let users create/update rows from the app.
  scope: "READ_SHEETS READ_USERS",

  // The four Insulet registers
  sheets: {
    projects: "8539610555568004",
    tasks: "7985931070951300",
    requests: "7915713086836612",
    people: "6361518384828292",
  },
};