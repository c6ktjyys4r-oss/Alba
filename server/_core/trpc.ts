import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
  import { initTRPC, TRPCError } from "@trpc/server";
  import superjson from "superjson";
  import type { TrpcContext } from "./context";
  import { getManagerAccess } from "../db";

  const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

  export const router = t.router;
  export const publicProcedure = t.procedure;

  const requireUser = t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

  export const protectedProcedure = t.procedure.use(requireUser);

  export const adminProcedure = t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user || ctx.user.role !== 'admin')
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );

  // Employee Self-Service Portal procedure
  export const empProtectedProcedure = t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.empEmployeeId)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Employee portal session required" });
      return next({ ctx: { ...ctx, empEmployeeId: ctx.empEmployeeId } });
    }),
  );

  // Manager Approval Portal procedure — requires an employee-portal session whose
  // effective role grants manager access (super_admin, branch_manager, or a routed
  // direct manager). Injects the resolved role + branch scope into the context so
  // downstream resolvers can enforce branch-level boundaries.
  export const empManagerProcedure = t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.empEmployeeId)
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Employee portal session required" });
      const access = await getManagerAccess(ctx.empEmployeeId);
      if (!access.isManager)
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
      return next({
        ctx: {
          ...ctx,
          empEmployeeId: ctx.empEmployeeId,
          managerRole: access.role,
          managerBranchId: access.branchId,
        },
      });
    }),
  );
  