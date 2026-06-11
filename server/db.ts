import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  branches,
  departments,
  employees,
  employeeDocuments,
  contracts,
  salaryStructures,
  payrollRecords,
  attendance,
  revenues,
  expenses,
  inventoryItems,
  inventoryTransactions,
  tasks,
  taskComments,
  employeeCredentials,
    leaveBalances,
    employeeRequests,
    empNotifications,
  } from "../drizzle/schema";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.trim();
    // Validate that DATABASE_URL looks like a PostgreSQL connection string
    if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
      console.error(
        `[Database] DATABASE_URL is not a valid PostgreSQL connection string.\n` +
        `  Expected format: postgresql://user:password@host:5432/database\n` +
        `  Received: "${url.substring(0, 20)}..."\n` +
        `  Please check your Render environment variables.`
      );
      return null;
    }
    try {
      const client = postgres(url);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (!user.openId) throw new Error("User openId is required for upsert");
  
  await db.insert(users).values(user).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: user.name,
      email: user.email,
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    }
  });
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(users).where(eq(users.openId, openId));
  return results[0] || null;
}

// ─── Branches ────────────────────────────────────────────────────────────────
export async function getBranches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).orderBy(asc(branches.name));
}

export async function createBranch(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(branches).values(data).returning();
}

export async function updateBranch(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(branches).set({ ...data, updatedAt: new Date() }).where(eq(branches.id, id)).returning();
}

export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(branches).where(eq(branches.id, id));
}

export async function getBranchById(id: number) {
    const db = await getDb();
    if (!db) return null;
    const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    return branch ?? null;
  }

  // ─── Departments ─────────────────────────────────────────────────────────────
export async function getDepartments(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(departments);
  if (branchId) {
    return query.where(eq(departments.branchId, branchId));
  }
  return query;
}

export async function createDepartment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(departments).values(data).returning();
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(departments).where(eq(departments.id, id));
}

// ─── Employees ───────────────────────────────────────────────────────────────
export async function getEmployees(filters: { branchId?: number; departmentId?: number; status?: string; search?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [];
  if (filters.branchId) conditions.push(eq(employees.branchId, filters.branchId));
  if (filters.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters.status) conditions.push(eq(employees.status, filters.status as any));
  if (filters.search) {
    conditions.push(or(
      like(employees.firstName, `%${filters.search}%`),
      like(employees.lastName, `%${filters.search}%`),
      like(employees.employeeCode, `%${filters.search}%`)
    ));
  }

  const query = db.select().from(employees);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(employees.createdAt));
  }
  return query.orderBy(desc(employees.createdAt));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(employees).where(eq(employees.id, id));
  return results[0] || null;
}

export async function createEmployee(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(employees).values(data).returning();
}

export async function updateEmployee(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(employees).where(eq(employees.id, id));
}

// ─── Employee Documents ───────────────────────────────────────────────────────
export async function getEmployeeDocuments(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
}

export async function createEmployeeDocument(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(employeeDocuments).values(data).returning();
}

export async function deleteEmployeeDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export async function getContracts(filters: { employeeId?: number; status?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.employeeId) conditions.push(eq(contracts.employeeId, filters.employeeId));
  if (filters.status) conditions.push(eq(contracts.status, filters.status as any));
  
  const query = db.select().from(contracts);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(contracts.startDate));
  }
  return query.orderBy(desc(contracts.startDate));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(contracts).where(eq(contracts.id, id));
  return results[0] || null;
}

export async function createContract(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(contracts).values(data).returning();
}

export async function updateContract(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(contracts).set({ ...data, updatedAt: new Date() }).where(eq(contracts.id, id)).returning();
}

export async function deleteContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(contracts).where(eq(contracts.id, id));
}

// ─── Salary Structures ────────────────────────────────────────────────────────
export async function getSalaryStructure(employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(salaryStructures).where(eq(salaryStructures.employeeId, employeeId));
  return results[0] || null;
}

export async function upsertSalaryStructure(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(salaryStructures).values(data).onConflictDoUpdate({
    target: salaryStructures.employeeId,
    set: { ...data, updatedAt: new Date() }
  }).returning();
}

// ─── Payroll Records ──────────────────────────────────────────────────────────
export async function getPayrollRecords(filters: { employeeId?: number; month?: number; year?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.employeeId) conditions.push(eq(payrollRecords.employeeId, filters.employeeId));
  if (filters.month) conditions.push(eq(payrollRecords.month, filters.month));
  if (filters.year) conditions.push(eq(payrollRecords.year, filters.year));
  
  const query = db.select().from(payrollRecords);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
  }
  return query.orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
}

export async function createPayrollRecord(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(payrollRecords).values(data).returning();
}

export async function updatePayrollStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(payrollRecords).set({ status: status as any, paidAt: status === "paid" ? new Date() : null }).where(eq(payrollRecords.id, id)).returning();
}

  export async function getPayrollRecordById(id: number) {
    const db = await getDb();
    if (!db) return null;
    const results = await db.select().from(payrollRecords).where(eq(payrollRecords.id, id));
    return results[0] || null;
  }

  export async function updatePayrollRecord(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.update(payrollRecords).set(data).where(eq(payrollRecords.id, id)).returning();
  }

  export async function deletePayrollRecord(id: number) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.delete(payrollRecords).where(eq(payrollRecords.id, id)).returning();
  }

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function getAttendance(filters: { employeeId?: number; date?: string; startDate?: string; endDate?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.employeeId) conditions.push(eq(attendance.employeeId, filters.employeeId));
  if (filters.date) conditions.push(eq(attendance.date, filters.date));
  if (filters.startDate && filters.endDate) {
    conditions.push(and(
      sql`${attendance.date} >= ${filters.startDate}`,
      sql`${attendance.date} <= ${filters.endDate}`
    ));
  }
  
  const query = db.select().from(attendance);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(attendance.date));
  }
  return query.orderBy(desc(attendance.date));
}

export async function logAttendance(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(attendance).values(data).returning();
}

// ─── Financials (Revenue & Expenses) ──────────────────────────────────────────
export async function getRevenues(filters: { branchId?: number; category?: string; startDate?: string; endDate?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.branchId) conditions.push(eq(revenues.branchId, filters.branchId));
  if (filters.category) conditions.push(eq(revenues.category, filters.category));
  if (filters.startDate && filters.endDate) {
    conditions.push(and(
      sql`${revenues.date} >= ${filters.startDate}`,
      sql`${revenues.date} <= ${filters.endDate}`
    ));
  }
  const query = db.select().from(revenues);
  if (conditions.length > 0) return query.where(and(...conditions)).orderBy(desc(revenues.date));
  return query.orderBy(desc(revenues.date));
}

export async function createRevenue(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(revenues).values(data).returning();
}

export async function getExpenses(filters: { branchId?: number; category?: string; startDate?: string; endDate?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.branchId) conditions.push(eq(expenses.branchId, filters.branchId));
  if (filters.category) conditions.push(eq(expenses.category, filters.category));
  if (filters.startDate && filters.endDate) {
    conditions.push(and(
      sql`${expenses.date} >= ${filters.startDate}`,
      sql`${expenses.date} <= ${filters.endDate}`
    ));
  }
  const query = db.select().from(expenses);
  if (conditions.length > 0) return query.where(and(...conditions)).orderBy(desc(expenses.date));
  return query.orderBy(desc(expenses.date));
}

export async function createExpense(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(expenses).values(data).returning();
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export async function getInventoryItems(filters: { branchId?: number; search?: string; lowStock?: boolean } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [eq(inventoryItems.isActive, true)];
  if (filters.branchId) conditions.push(eq(inventoryItems.branchId, filters.branchId));
  if (filters.search) conditions.push(like(inventoryItems.name, `%${filters.search}%`));
  if (filters.lowStock) conditions.push(sql`${inventoryItems.quantity} <= ${inventoryItems.minimumStock}`);
  
  return db.select().from(inventoryItems).where(and(...conditions)).orderBy(asc(inventoryItems.name));
}

export async function createInventoryItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(inventoryItems).values(data).returning();
}

export async function updateInventoryItem(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(inventoryItems).set({ ...data, updatedAt: new Date() }).where(eq(inventoryItems.id, id)).returning();
}

export async function getInventoryTransactions(filters: { itemId?: number; branchId?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.itemId) conditions.push(eq(inventoryTransactions.itemId, filters.itemId));
  if (filters.branchId) {
    conditions.push(or(
      eq(inventoryTransactions.fromBranchId, filters.branchId),
      eq(inventoryTransactions.toBranchId, filters.branchId)
    ));
  }
  const query = db.select().from(inventoryTransactions);
  if (conditions.length > 0) return query.where(and(...conditions)).orderBy(desc(inventoryTransactions.createdAt));
  return query.orderBy(desc(inventoryTransactions.createdAt));
}

export async function createInventoryTransaction(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  return db.transaction(async (tx) => {
    const [transaction] = await tx.insert(inventoryTransactions).values(data).returning();
    
    // Update stock levels
    if (data.type === "stock_in" || data.type === "transfer_in") {
      await tx.update(inventoryItems).set({ 
        quantity: sql`${inventoryItems.quantity} + ${data.quantity}` 
      }).where(eq(inventoryItems.id, data.itemId));
    } else if (data.type === "stock_out" || data.type === "transfer_out") {
      await tx.update(inventoryItems).set({ 
        quantity: sql`${inventoryItems.quantity} - ${data.quantity}` 
      }).where(eq(inventoryItems.id, data.itemId));
    } else if (data.type === "adjustment") {
      await tx.update(inventoryItems).set({ 
        quantity: data.quantity 
      }).where(eq(inventoryItems.id, data.itemId));
    }
    
    return transaction;
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function getTasks(filters: { branchId?: number; departmentId?: number; employeeId?: number; status?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [];
  if (filters.branchId) conditions.push(eq(tasks.assignedToBranchId, filters.branchId));
  if (filters.departmentId) conditions.push(eq(tasks.assignedToDepartmentId, filters.departmentId));
  if (filters.employeeId) conditions.push(eq(tasks.assignedToEmployeeId, filters.employeeId));
  if (filters.status) conditions.push(eq(tasks.status, filters.status as any));
  
  const query = db.select().from(tasks);
  if (conditions.length > 0) return query.where(and(...conditions)).orderBy(desc(tasks.createdAt));
  return query.orderBy(desc(tasks.createdAt));
}

export async function createTask(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(tasks).values(data).returning();
}

export async function updateTask(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
}

export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(asc(taskComments.createdAt));
}

export async function createTaskComment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(taskComments).values(data).returning();
}

  // ─── Departments (update) ─────────────────────────────────────────────────────
  export async function updateDepartment(id: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    // Remove undefined keys so we don't overwrite columns we didn't touch
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }
    return db.update(departments).set(clean).where(eq(departments.id, id)).returning();
  }

  // ─── Dashboard Statistics ─────────────────────────────────────────────────────
  export async function getDashboardStats() {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split("T")[0];
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      const [activeEmps, allContracts, allTasks, todayAttend, monthRevs, monthExps, lowStockItems] =
        await Promise.all([
          getEmployees({ status: "active" }),
          getContracts({}),
          getTasks({}),
          getAttendance({ date: today }),
          getRevenues({ startDate: monthStart, endDate: today }),
          getExpenses({ startDate: monthStart, endDate: today }),
          getInventoryItems({ lowStock: true }),
        ]);

      const contracts   = (allContracts   || []) as any[];
      const tasks       = (allTasks       || []) as any[];
      const attendToday = (todayAttend    || []) as any[];
      const revs        = (monthRevs      || []) as any[];
      const exps        = (monthExps      || []) as any[];

      const monthRevenue  = revs.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const monthExpenses = exps.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      return {
        totalEmployees:    ((activeEmps || []) as any[]).length,
        activeContracts:   contracts.filter((c: any) => c.status === "active").length,
        expiringContracts: contracts.filter(
          (c: any) => c.status === "active" && c.endDate && c.endDate <= thirtyDaysLater
        ).length,
        todayAttendance: attendToday.length,
        lateToday:       attendToday.filter((a: any) => a.status === "late").length,
        overdueTasks:    tasks.filter((t: any) => t.status === "overdue").length,
        lowStockCount:   ((lowStockItems || []) as any[]).length,
        monthRevenue,
        monthExpenses,
        netProfit: monthRevenue - monthExpenses,
      };
    } catch (err) {
      console.error("[getDashboardStats]", err);
      return {
        totalEmployees: 0, activeContracts: 0, expiringContracts: 0,
        todayAttendance: 0, lateToday: 0, overdueTasks: 0,
        lowStockCount: 0, monthRevenue: 0, monthExpenses: 0, netProfit: 0,
      };
    }
  }

  // ─── Employee Credentials ─────────────────────────────────────────────────────
  export async function getEmployeeCredential(username: string) {
    const db = await getDb();
    if (!db) return null;
    const r = await db.select().from(employeeCredentials).where(eq(employeeCredentials.username, username));
    return r[0] || null;
  }
  export async function createEmployeeCredential(data: { employeeId: number; username: string; passwordHash: string }) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.insert(employeeCredentials).values(data).returning();
  }
  export async function updateEmployeeCredential(employeeId: number, data: any) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.update(employeeCredentials).set({ ...data, updatedAt: new Date() }).where(eq(employeeCredentials.employeeId, employeeId)).returning();
  }
  export async function listEmployeeCredentials() {
    const db = await getDb();
    if (!db) return [];
    return db.select({ employeeId: employeeCredentials.employeeId, username: employeeCredentials.username, isActive: employeeCredentials.isActive, lastLoginAt: employeeCredentials.lastLoginAt }).from(employeeCredentials);
  }

  // ─── Password Hashing (PBKDF2 — built-in Node.js crypto) ────────────────────
    export function hashPassword(plain: string): string {
      const salt = randomBytes(16).toString("hex");
      const hash = pbkdf2Sync(plain, salt, 100_000, 64, "sha512").toString("hex");
      return `pbkdf2:${salt}:${hash}`;
    }

    export function verifyPassword(plain: string, stored: string): boolean {
      if (!stored.startsWith("pbkdf2:")) return plain === stored;
      const [, salt, hash] = stored.split(":");
      const candidate = pbkdf2Sync(plain, salt, 100_000, 64, "sha512");
      return timingSafeEqual(Buffer.from(hash, "hex"), candidate);
    }

    // ─── Employee Credentials ─────────────────────────────────────────────────────
    export async function getEmployeeCredential(username: string) {
      const d = await getDb();
      if (!d) return null;
      const r = await d.select().from(employeeCredentials).where(eq(employeeCredentials.username, username));
      return r[0] || null;
    }

    export async function getEmployeeCredentialByEmpId(employeeId: number) {
      const d = await getDb();
      if (!d) return null;
      const r = await d.select().from(employeeCredentials).where(eq(employeeCredentials.employeeId, employeeId));
      return r[0] || null;
    }

    export async function createEmployeeCredential(data: {
      employeeId: number;
      username: string;
      plainPassword: string;
      mustChangePassword?: boolean;
    }) {
      const d = await getDb();
      if (!d) throw new Error("DB not available");
      const dup = await d.select({ id: employeeCredentials.id }).from(employeeCredentials)
        .where(eq(employeeCredentials.username, data.username));
      if (dup.length > 0) throw new Error(`Username "${data.username}" is already in use`);
      return d.insert(employeeCredentials).values({
        employeeId: data.employeeId,
        username: data.username,
        passwordHash: hashPassword(data.plainPassword),
        isActive: true,
        mustChangePassword: data.mustChangePassword ?? true,
      }).returning();
    }

    export async function updateEmployeeCredential(employeeId: number, data: any) {
      const d = await getDb();
      if (!d) throw new Error("DB not available");
      return d.update(employeeCredentials)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(employeeCredentials.employeeId, employeeId))
        .returning();
    }

    export async function changeEmployeePassword(employeeId: number, newPlain: string) {
      const d = await getDb();
      if (!d) throw new Error("DB not available");
      return d.update(employeeCredentials)
        .set({ passwordHash: hashPassword(newPlain), mustChangePassword: false, updatedAt: new Date() })
        .where(eq(employeeCredentials.employeeId, employeeId))
        .returning();
    }

    export async function listEmployeeCredentials() {
      const d = await getDb();
      if (!d) return [];
      return d.select({
        employeeId: employeeCredentials.employeeId,
        username: employeeCredentials.username,
        isActive: employeeCredentials.isActive,
        mustChangePassword: employeeCredentials.mustChangePassword,
        lastLoginAt: employeeCredentials.lastLoginAt,
      }).from(employeeCredentials);
    }

    export async function provisionAllEmployeeCredentials(): Promise<{
      provisioned: number; skipped: number; errors: string[];
    }> {
      const d = await getDb();
      if (!d) throw new Error("DB not available");
      const allEmps   = await d.select().from(employees).where(eq(employees.status, "active"));
      const existing  = await d.select({ employeeId: employeeCredentials.employeeId }).from(employeeCredentials);
      const existingSet = new Set(existing.map((c: any) => c.employeeId));
      let provisioned = 0, skipped = 0;
      const errors: string[] = [];
      for (const emp of allEmps) {
        if (existingSet.has(emp.id))      { skipped++; continue; }
        if (!emp.nationalId?.trim())       { skipped++; continue; }
        const username = emp.nationalId.trim();
        try {
          const dup = await d.select({ id: employeeCredentials.id })
            .from(employeeCredentials).where(eq(employeeCredentials.username, username));
          if (dup.length > 0) {
            errors.push(`${emp.firstName} ${emp.lastName}: National ID "${username}" already used`);
            continue;
          }
          await d.insert(employeeCredentials).values({
            employeeId: emp.id, username,
            passwordHash: hashPassword(username),
            isActive: true, mustChangePassword: true,
          });
          provisioned++;
        } catch (err: any) {
          errors.push(`${emp.firstName} ${emp.lastName}: ${err.message}`);
        }
      }
      return { provisioned, skipped, errors };
    }

    // ─── Leave Balances ───────────────────────────────────────────────────────────
  export async function getLeaveBalance(employeeId: number, year: number) {
    const db = await getDb();
    if (!db) return null;
    const r = await db.select().from(leaveBalances).where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
    return r[0] || null;
  }
  export async function upsertLeaveBalance(data: { employeeId: number; year: number; annualDaysTotal?: number; annualDaysUsed?: number; sickDaysUsed?: number }) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    const existing = await getLeaveBalance(data.employeeId, data.year);
    if (existing) {
      const upd: any = { updatedAt: new Date() };
      if (data.annualDaysTotal !== undefined) upd.annualDaysTotal = data.annualDaysTotal;
      if (data.annualDaysUsed  !== undefined) upd.annualDaysUsed  = data.annualDaysUsed;
      if (data.sickDaysUsed    !== undefined) upd.sickDaysUsed    = data.sickDaysUsed;
      return db.update(leaveBalances).set(upd).where(and(eq(leaveBalances.employeeId, data.employeeId), eq(leaveBalances.year, data.year))).returning();
    }
    return db.insert(leaveBalances).values({ employeeId: data.employeeId, year: data.year, annualDaysTotal: data.annualDaysTotal ?? 21, annualDaysUsed: data.annualDaysUsed ?? 0, sickDaysUsed: data.sickDaysUsed ?? 0 }).returning();
  }

  // ─── Employee Requests ────────────────────────────────────────────────────────
  export async function createEmployeeRequest(data: any) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.insert(employeeRequests).values(data).returning();
  }
  export async function getEmployeeRequests(employeeId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(employeeRequests).where(eq(employeeRequests.employeeId, employeeId)).orderBy(desc(employeeRequests.createdAt));
  }
  export async function getManagerRequests(managerId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(employeeRequests).where(eq(employeeRequests.managerId, managerId)).orderBy(desc(employeeRequests.createdAt));
  }
  export async function getRequestById(id: number) {
    const db = await getDb();
    if (!db) return null;
    const r = await db.select().from(employeeRequests).where(eq(employeeRequests.id, id));
    return r[0] || null;
  }
  export async function updateEmployeeRequest(id: number, data: { status: "approved" | "rejected"; managerComment?: string | null; reviewedBy: number }) {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    return db.update(employeeRequests).set({ status: data.status, managerComment: data.managerComment ?? null, reviewedBy: data.reviewedBy, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(employeeRequests.id, id)).returning();
  }

  // ─── Employee Notifications ───────────────────────────────────────────────────
  export async function createEmpNotification(data: { recipientEmployeeId: number; senderEmployeeId?: number; requestId?: number; type: string; message: string }) {
    const db = await getDb();
    if (!db) return null;
    return db.insert(empNotifications).values(data as any).returning();
  }
  export async function getEmpNotifications(employeeId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(empNotifications).where(eq(empNotifications.recipientEmployeeId, employeeId)).orderBy(desc(empNotifications.createdAt));
  }
  export async function markEmpNotificationRead(id: number, employeeId: number) {
    const db = await getDb();
    if (!db) return null;
    return db.update(empNotifications).set({ isRead: true }).where(and(eq(empNotifications.id, id), eq(empNotifications.recipientEmployeeId, employeeId))).returning();
  }
  export async function markAllEmpNotificationsRead(employeeId: number) {
    const db = await getDb();
    if (!db) return null;
    return db.update(empNotifications).set({ isRead: true }).where(eq(empNotifications.recipientEmployeeId, employeeId)).returning();
  }
  