import {
  resolveForgeApiUrl,
  resolveOAuthServerUrl,
} from "@shared/deployConfig";

// Fallback secret for standalone mode when JWT_SECRET is not set
const FALLBACK_JWT_SECRET = "alba-standalone-dev-secret-change-in-production";

export const ENV = {
  appId: process.env.VITE_APP_ID?.trim() ?? "",
  cookieSecret: process.env.JWT_SECRET?.trim() || FALLBACK_JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
  oAuthServerUrl: resolveOAuthServerUrl(process.env.OAUTH_SERVER_URL),
  ownerOpenId: process.env.OWNER_OPEN_ID?.trim() ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: resolveForgeApiUrl(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY?.trim() ?? "",
};
