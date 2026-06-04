import { getDeployStatus } from "./config";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (): string | null => {
  const { oauthPortalUrl, appId, oauthConfigured } = getDeployStatus();

  if (!oauthConfigured || !appId) {
    return null;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    console.error("[Auth] Invalid OAuth portal URL:", oauthPortalUrl, error);
    return null;
  }
};
