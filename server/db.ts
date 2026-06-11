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
} from "../drizzle/schema";
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
  