import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

// ─── In-Memory User Store ────────────────────────────────────────────────────

export type LocalUser = {
  id: number;
  username: string;
  passwordHash: string; // plain text for now (standalone mode)
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

const DEFAULT_ADMIN: LocalUser = {
  id: 1,
  username: "admin",
  passwordHash: "admin123",
  openId: "local-admin-001",
  name: "Administrator",
  email: "admin@alba-erp.local",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// In-memory user store
const users: LocalUser[] = [DEFAULT_ADMIN];

// ─── Auth Helpers ────────────────────────────────────────────────────────────

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

function toUserRecord(localUser: LocalUser): User {
  return {
    id: localUser.id,
    openId: localUser.openId,
    name: localUser.name,
    email: localUser.email,
    loginMethod: localUser.loginMethod,
    role: localUser.role,
    createdAt: localUser.createdAt,
    updatedAt: localUser.updatedAt,
    lastSignedIn: localUser.lastSignedIn,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const localAuth = {
  /** Verify credentials and return a signed session token */
  async login(username: string, password: string): Promise<{ token: string; user: User } | null> {
    const found = users.find(
      u => u.username === username && u.passwordHash === password
    );
    if (!found) return null;

    found.lastSignedIn = new Date();

    const token = await new SignJWT({
      openId: found.openId,
      appId: "local",
      name: found.name || found.username,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
      .sign(getSessionSecret());

    return { token, user: toUserRecord(found) };
  },

  /** Authenticate a request by verifying the session cookie */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    // Parse cookies manually
    const cookies = new Map<string, string>();
    cookieHeader.split(";").forEach(pair => {
      const [key, ...val] = pair.split("=");
      if (key && val.length > 0) {
        cookies.set(key.trim(), val.join("=").trim());
      }
    });

    const sessionCookie = cookies.get(COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
      const { payload } = await jwtVerify(sessionCookie, getSessionSecret(), {
        algorithms: ["HS256"],
      });

      const openId = payload.openId as string;
      if (!openId) return null;

      const found = users.find(u => u.openId === openId);
      if (!found) return null;

      return toUserRecord(found);
    } catch {
      return null;
    }
  },

  /** Set the session cookie on the response */
  setSessionCookie(res: Response, req: Request, token: string) {
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  },
};
