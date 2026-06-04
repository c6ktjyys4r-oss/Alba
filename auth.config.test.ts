import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildDeployStatus,
  DEFAULT_OAUTH_PORTAL_URL,
  normalizeAbsoluteUrl,
  resolveOAuthPortalUrl,
} from "./shared/deployConfig";
import { getPublicRuntimeConfig, injectRuntimeConfig } from "./server/_core/publicConfig";

describe("deployConfig", () => {
  it("defaults OAuth portal URL when missing", () => {
    expect(resolveOAuthPortalUrl(undefined)).toBe(DEFAULT_OAUTH_PORTAL_URL);
    expect(resolveOAuthPortalUrl("")).toBe(DEFAULT_OAUTH_PORTAL_URL);
    expect(resolveOAuthPortalUrl("undefined")).toBe(DEFAULT_OAUTH_PORTAL_URL);
  });

  it("adds https protocol when missing", () => {
    expect(normalizeAbsoluteUrl("portal.manus.im", DEFAULT_OAUTH_PORTAL_URL)).toBe(
      "https://portal.manus.im"
    );
  });

  it("lists missing required env vars", () => {
    const status = buildDeployStatus({});
    expect(status.oauthConfigured).toBe(false);
    expect(status.databaseConfigured).toBe(false);
    expect(status.missingEnvVars).toEqual([
      "VITE_APP_ID",
      "DATABASE_URL",
      "JWT_SECRET",
    ]);
  });

  it("marks deploy ready when required env vars are present", () => {
    const status = buildDeployStatus({
      viteAppId: "abc123",
      databaseUrl: "mysql://localhost/db",
      jwtSecret: "secret",
    });

    expect(status.oauthConfigured).toBe(true);
    expect(status.databaseConfigured).toBe(true);
    expect(status.jwtConfigured).toBe(true);
    expect(status.missingEnvVars).toEqual([]);
  });
});

describe("publicConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("injects deploy status into HTML", () => {
    process.env.VITE_APP_ID = "test-app-id";
    process.env.DATABASE_URL = "mysql://localhost/db";
    process.env.JWT_SECRET = "secret";

    const html = injectRuntimeConfig("<html><head></head><body></body></html>");

    expect(html).toContain("window.__RUNTIME_CONFIG__=");
    expect(html).toContain('"oauthConfigured":true');
    expect(html).toContain('"appId":"test-app-id"');
  });

  it("reports missing env vars through runtime config", () => {
    delete process.env.VITE_APP_ID;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    const config = getPublicRuntimeConfig();
    expect(config.oauthConfigured).toBe(false);
    expect(config.missingEnvVars).toContain("VITE_APP_ID");
  });
});

describe("getLoginUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (window as Window & { __RUNTIME_CONFIG__?: unknown }).__RUNTIME_CONFIG__;
  });

  it("returns null when OAuth app id is missing", async () => {
    window.__RUNTIME_CONFIG__ = {
      oauthPortalUrl: DEFAULT_OAUTH_PORTAL_URL,
      appId: "",
      oauthConfigured: false,
      databaseConfigured: false,
      jwtConfigured: false,
      missingEnvVars: ["VITE_APP_ID"],
    };

    const { getLoginUrl } = await import("./client/src/const");
    expect(getLoginUrl()).toBeNull();
  });

  it("builds a valid login URL when configured", async () => {
    window.__RUNTIME_CONFIG__ = {
      oauthPortalUrl: DEFAULT_OAUTH_PORTAL_URL,
      appId: "test-app-id",
      oauthConfigured: true,
      databaseConfigured: true,
      jwtConfigured: true,
      missingEnvVars: [],
    };

    const { getLoginUrl } = await import("./client/src/const");
    const url = new URL(getLoginUrl()!);

    expect(url.origin).toBe("https://portal.manus.im");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("test-app-id");
  });
});
