/** Default Manus OAuth/API endpoints when env vars are not set. */
export const DEFAULT_OAUTH_PORTAL_URL = "https://portal.manus.im";
export const DEFAULT_OAUTH_SERVER_URL = "https://api.manus.im";
export const DEFAULT_FORGE_API_URL = "https://forge.manus.im";

export type DeployStatus = {
  oauthPortalUrl: string;
  appId: string;
  oauthConfigured: boolean;
  databaseConfigured: boolean;
  jwtConfigured: boolean;
  missingEnvVars: string[];
};

const INVALID_ENV_LITERALS = new Set(["undefined", "null"]);

/** Normalize env-provided URLs; fall back when empty, invalid, or missing a protocol. */
export function normalizeAbsoluteUrl(
  value: string | undefined,
  fallback: string
): string {
  const trimmed = value?.trim();
  if (!trimmed || INVALID_ENV_LITERALS.has(trimmed.toLowerCase())) {
    return fallback;
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    return `${parsed.origin}${parsed.pathname === "/" ? "" : parsed.pathname}`.replace(
      /\/$/,
      ""
    );
  } catch {
    return fallback;
  }
}

export function resolveOAuthPortalUrl(value: string | undefined): string {
  return normalizeAbsoluteUrl(value, DEFAULT_OAUTH_PORTAL_URL);
}

export function resolveOAuthServerUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_OAUTH_SERVER_URL;
}

export function resolveForgeApiUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_FORGE_API_URL;
}

export function buildDeployStatus(env: {
  viteOAuthPortalUrl?: string;
  viteAppId?: string;
  databaseUrl?: string;
  jwtSecret?: string;
}): DeployStatus {
  const missingEnvVars: string[] = [];
  const oauthPortalUrl = resolveOAuthPortalUrl(env.viteOAuthPortalUrl);
  const appId = env.viteAppId?.trim() ?? "";

  if (!env.viteAppId?.trim()) {
    missingEnvVars.push("VITE_APP_ID");
  }
  if (!env.databaseUrl?.trim()) {
    missingEnvVars.push("DATABASE_URL");
  }
  if (!env.jwtSecret?.trim()) {
    missingEnvVars.push("JWT_SECRET");
  }

  return {
    oauthPortalUrl,
    appId,
    oauthConfigured: Boolean(env.viteAppId?.trim()),
    databaseConfigured: Boolean(env.databaseUrl?.trim()),
    jwtConfigured: Boolean(env.jwtSecret?.trim()),
    missingEnvVars,
  };
}
