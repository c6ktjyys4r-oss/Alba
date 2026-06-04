import { getDeployStatus } from "./config";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const { oauthPortalUrl, appId, oauthConfigured } = getDeployStatus();

  if (!oauthConfigured || !appId) {
    throw new Error(
      "OAuth is not configured. Set VITE_APP_ID in your Render environment variables."
    );
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
