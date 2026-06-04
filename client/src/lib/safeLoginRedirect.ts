import { isOAuthConfigured } from "@/config";
import { getLoginUrl } from "@/const";

/** Redirect to Manus login when OAuth is configured; otherwise no-op. */
export function tryRedirectToLogin(): boolean {
  if (!isOAuthConfigured()) {
    return false;
  }

  window.location.href = getLoginUrl();
  return true;
}
