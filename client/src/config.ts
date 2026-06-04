import {
  buildDeployStatus,
  DEFAULT_OAUTH_PORTAL_URL,
  type DeployStatus,
} from "@shared/deployConfig";

export type PublicRuntimeConfig = DeployStatus;

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: PublicRuntimeConfig;
  }
}

function readRuntimeConfig(): PublicRuntimeConfig | undefined {
  return typeof window !== "undefined" ? window.__RUNTIME_CONFIG__ : undefined;
}

/** Reads deploy status from runtime injection (production) or Vite env (dev/build). */
export function getDeployStatus(): PublicRuntimeConfig {
  const runtime = readRuntimeConfig();
  if (runtime) {
    return runtime;
  }

  return buildDeployStatus({
    viteOAuthPortalUrl: import.meta.env.VITE_OAUTH_PORTAL_URL,
    viteAppId: import.meta.env.VITE_APP_ID,
    databaseUrl: import.meta.env.DATABASE_URL,
    jwtSecret: import.meta.env.JWT_SECRET,
  });
}

export function isOAuthConfigured(): boolean {
  return getDeployStatus().oauthConfigured;
}

export function isAppReady(): boolean {
  const status = getDeployStatus();
  return status.oauthConfigured && status.databaseConfigured && status.jwtConfigured;
}

/** @deprecated Use getDeployStatus() */
export function getPublicConfig() {
  const status = getDeployStatus();
  return {
    oauthPortalUrl: status.oauthPortalUrl || DEFAULT_OAUTH_PORTAL_URL,
    appId: status.appId,
  };
}
