import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
  import type { User } from "../../drizzle/schema";
  import { sdk } from "./sdk";
  import { localAuth } from "./localAuth";
  import { jwtVerify } from "jose";
  import { ENV } from "./env";
  import { getEmployeeById, effectiveRoleOf } from "../db";

  const EMP_COOKIE = "emp_session";

  export type TrpcContext = {
    req: CreateExpressContextOptions["req"];
    res: CreateExpressContextOptions["res"];
    user: User | null;
    empEmployeeId: number | null;
  };

  function getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  export async function createContext(
    opts: CreateExpressContextOptions
  ): Promise<TrpcContext> {
    let user: User | null = null;
    let empEmployeeId: number | null = null;

    try { user = await localAuth.authenticateRequest(opts.req); } catch {}
    if (!user) {
      try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; }
    }

    // Employee portal session (separate cookie)
    try {
      const cookieHeader = opts.req.headers.cookie || "";
      const cookies = new Map<string, string>();
      cookieHeader.split(";").forEach(pair => {
        const [key, ...val] = pair.split("=");
        if (key && val.length > 0) cookies.set(key.trim(), val.join("=").trim());
      });
      const empCookie = cookies.get(EMP_COOKIE);
      if (empCookie) {
        const { payload } = await jwtVerify(empCookie, getSessionSecret(), { algorithms: ["HS256"] });
        if (typeof payload.empEmployeeId === "number") empEmployeeId = payload.empEmployeeId;
      }
    } catch {}

    // Unified identity: a Super Admin who logs in with employee credentials gets
    // the same admin access the legacy admin account had. Synthesize an admin
    // `user` from their employee record so the existing admin/protected routers
    // work unchanged, without exposing them to non-super-admin sessions.
    if (!user && empEmployeeId != null) {
      try {
        const emp = await getEmployeeById(empEmployeeId);
        if (emp && effectiveRoleOf(emp) === "super_admin") {
          const now = new Date();
          user = {
            id: emp.id,
            openId: `emp:${emp.id}`,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            email: emp.email ?? null,
            loginMethod: "employee",
            role: "admin",
            createdAt: now,
            updatedAt: now,
            lastSignedIn: now,
          };
        }
      } catch {}
    }

    return { req: opts.req, res: opts.res, user, empEmployeeId };
  }
  