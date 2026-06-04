import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Branches ─────────────────────────────────────────────────────────────────
export async function getBranches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).orderBy(asc(branches.name));
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result[0];
}

export async function createBranch(data: typeof branches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(branches).values(data);
  return result;
}

export async function updateBranch(id: number, data: Partial<typeof branches.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(branches).set(data).where(eq(branches.id, id));
}

export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(branches).where(eq(branches.id, id));
}

// ─── Departments ──────────────────────────────────────────────────────────────
export async function getDepartments(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) return db.select().from(departments).where(eq(departments.branchId, branchId));
  return db.select().from(departments).orderBy(asc(departments.name));
}

export async function createDepartment(data: typeof departments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(departments).values(data);
}

export async function updateDepartment(id: number, data: Partial<typeof departments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(departments).where(eq(departments.id, id));
}

// ─── Employees ────────────────────────────────────────────────────────────────
export async function getEmployees(filters?: { branchId?: number; departmentId?: number; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(employees);
  const conditions = [];
  if (filters?.branchId) conditions.push(eq(employees.branchId, filters.branchId));
  if (filters?.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters?.status) conditions.push(eq(employees.status, filters.status as any));
  if (filters?.search) {
    conditions.push(
      or(
        like(employees.firstName, `%${filters.search}%`),
        like(employees.lastName, `%${filters.search}%`),
        like(employees.email, `%${filters.search}%`),
        like(employees.employeeCode, `%${filters.search}%`)
      )
    );
  }
  if (conditions.length > 0) {
    return (query as any).where(and(...conditions)).orderBy(asc(employees.firstName));
  }
  return (query as any).orderBy(asc(employees.firstName));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function createEmployee(data: typeof employees.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(employees).values(data);
}

export async function updateEmployee(id: number, data: Partial<typeof employees.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(employees).where(eq(employees.id, id));
}

export async function getEmployeeDocuments(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId)).orderBy(desc(employeeDocuments.uploadedAt));
}

export async function addEmployeeDocument(data: typeof employeeDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(employeeDocuments).values(data);
}

export async function deleteEmployeeDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export async function getContracts(filters?: { employeeId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.employeeId) conditions.push(eq(contracts.employeeId, filters.employeeId));
  if (filters?.status) conditions.push(eq(contracts.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(contracts).where(and(...conditions)).orderBy(desc(contracts.createdAt));
  }
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function createContract(data: typeof contracts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(contracts).values(data);
}

export async function updateContract(id: number, data: Partial<typeof contracts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(contracts).set(data).where(eq(contracts.id, id));
}

export async function deleteContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(contracts).where(eq(contracts.id, id));
}

// ─── Salary Structures ────────────────────────────────────────────────────────
export async function getSalaryStructure(employeeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salaryStructures).where(eq(salaryStructures.employeeId, employeeId)).limit(1);
  return result[0];
}

export async function upsertSalaryStructure(data: typeof salaryStructures.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(salaryStructures).values(data).onDuplicateKeyUpdate({
    set: {
      basicSalary: data.basicSalary,
      housingAllowance: data.housingAllowance,
      transportAllowance: data.transportAllowance,
      otherAllowances: data.otherAllowances,
      socialInsurance: data.socialInsurance,
      taxDeduction: data.taxDeduction,
      otherDeductions: data.otherDeductions,
      currency: data.currency,
    },
  });
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
export async function getPayrollRecords(filters?: { employeeId?: number; month?: number; year?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.employeeId) conditions.push(eq(payrollRecords.employeeId, filters.employeeId));
  if (filters?.month) conditions.push(eq(payrollRecords.month, filters.month));
  if (filters?.year) conditions.push(eq(payrollRecords.year, filters.year));
  if (filters?.status) conditions.push(eq(payrollRecords.status, filters.status as any));
  if (conditions.length > 0) {
    return db.select().from(payrollRecords).where(and(...conditions)).orderBy(desc(payrollRecords.generatedAt));
  }
  return db.select().from(payrollRecords).orderBy(desc(payrollRecords.generatedAt));
}

export async function createPayrollRecord(data: typeof payrollRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(payrollRecords).values(data);
}

export async function updatePayrollRecord(id: number, data: Partial<typeof payrollRecords.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(payrollRecords).set(data).where(eq(payrollRecords.id, id));
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function getAttendance(filters?: { employeeId?: number; dateFrom?: string; dateTo?: string; status?: string; branchId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.employeeId) conditions.push(eq(attendance.employeeId, filters.employeeId));
  if (filters?.status) conditions.push(eq(attendance.status, filters.status as any));
  if (filters?.dateFrom) conditions.push(sql`${attendance.date} >= ${filters.dateFrom}`);
  if (filters?.dateTo) conditions.push(sql`${attendance.date} <= ${filters.dateTo}`);
  if (conditions.length > 0) {
    return db.select().from(attendance).where(and(...conditions)).orderBy(desc(attendance.date));
  }
  return db.select().from(attendance).orderBy(desc(attendance.date)).limit(500);
}

export async function createAttendanceRecord(data: typeof attendance.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(attendance).values(data);
}

export async function updateAttendanceRecord(id: number, data: Partial<typeof attendance.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(attendance).set(data).where(eq(attendance.id, id));
}

export async function deleteAttendanceRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(attendance).where(eq(attendance.id, id));
}

// ─── Revenue ──────────────────────────────────────────────────────────────────
export async function getRevenues(filters?: { branchId?: number; dateFrom?: string; dateTo?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.branchId) conditions.push(eq(revenues.branchId, filters.branchId));
  if (filters?.category) conditions.push(eq(revenues.category, filters.category));
  if (filters?.dateFrom) conditions.push(sql`${revenues.date} >= ${filters.dateFrom}`);
  if (filters?.dateTo) conditions.push(sql`${revenues.date} <= ${filters.dateTo}`);
  if (conditions.length > 0) {
    return db.select().from(revenues).where(and(...conditions)).orderBy(desc(revenues.date));
  }
  return db.select().from(revenues).orderBy(desc(revenues.date));
}

export async function createRevenue(data: typeof revenues.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(revenues).values(data);
}

export async function updateRevenue(id: number, data: Partial<typeof revenues.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(revenues).set(data).where(eq(revenues.id, id));
}

export async function deleteRevenue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(revenues).where(eq(revenues.id, id));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export async function getExpenses(filters?: { branchId?: number; dateFrom?: string; dateTo?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.branchId) conditions.push(eq(expenses.branchId, filters.branchId));
  if (filters?.category) conditions.push(eq(expenses.category, filters.category));
  if (filters?.dateFrom) conditions.push(sql`${expenses.date} >= ${filters.dateFrom}`);
  if (filters?.dateTo) conditions.push(sql`${expenses.date} <= ${filters.dateTo}`);
  if (conditions.length > 0) {
    return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
  }
  return db.select().from(expenses).orderBy(desc(expenses.date));
}

export async function createExpense(data: typeof expenses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(expenses).values(data);
}

export async function updateExpense(id: number, data: Partial<typeof expenses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(expenses).set(data).where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(expenses).where(eq(expenses.id, id));
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function getInventoryItems(filters?: { branchId?: number; category?: string; lowStock?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(inventoryItems.isActive, true)];
  if (filters?.branchId) conditions.push(eq(inventoryItems.branchId, filters.branchId));
  if (filters?.category) conditions.push(eq(inventoryItems.category, filters.category));
  if (filters?.search) {
    conditions.push(or(like(inventoryItems.name, `%${filters.search}%`), like(inventoryItems.itemCode, `%${filters.search}%`)) as any);
  }
  const items = await db.select().from(inventoryItems).where(and(...conditions)).orderBy(asc(inventoryItems.name));
  if (filters?.lowStock) {
    return items.filter((i) => Number(i.quantity) <= Number(i.minimumStock));
  }
  return items;
}

export async function getInventoryItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return result[0];
}

export async function createInventoryItem(data: typeof inventoryItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(inventoryItems).values(data);
}

export async function updateInventoryItem(id: number, data: Partial<typeof inventoryItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
}

export async function getInventoryTransactions(itemId?: number, branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (itemId) conditions.push(eq(inventoryTransactions.itemId, itemId));
  if (branchId) {
    conditions.push(or(eq(inventoryTransactions.fromBranchId, branchId), eq(inventoryTransactions.toBranchId, branchId)) as any);
  }
  if (conditions.length > 0) {
    return db.select().from(inventoryTransactions).where(and(...conditions)).orderBy(desc(inventoryTransactions.createdAt)).limit(200);
  }
  return db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt)).limit(200);
}

export async function createInventoryTransaction(data: typeof inventoryTransactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(inventoryTransactions).values(data);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function getTasks(filters?: { employeeId?: number; departmentId?: number; branchId?: number; status?: string; priority?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.employeeId) conditions.push(eq(tasks.assignedToEmployeeId, filters.employeeId));
  if (filters?.departmentId) conditions.push(eq(tasks.assignedToDepartmentId, filters.departmentId));
  if (filters?.branchId) conditions.push(eq(tasks.assignedToBranchId, filters.branchId));
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(tasks.priority, filters.priority as any));
  if (conditions.length > 0) {
    return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(tasks).values(data);
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(asc(taskComments.createdAt));
}

export async function createTaskComment(data: typeof taskComments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(taskComments).values(data);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [
    totalEmployees,
    activeContracts,
    expiringContracts,
    todayAttendance,
    lateToday,
    earlyLeaveToday,
    openTasks,
    overdueTasks,
    lowStockItems,
    monthRevenue,
    monthExpenses,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(contracts).where(
      and(
        eq(contracts.status, "active"),
        sql`${contracts.endDate} <= ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`
      )
    ),
    db.select({ count: sql<number>`count(*)` }).from(attendance).where(sql`${attendance.date} = ${today}`),
    db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(sql`${attendance.date} = ${today}`, eq(attendance.status, "late"))),
    db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(sql`${attendance.date} = ${today}`, eq(attendance.status, "early_leave"))),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress")) as any),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "overdue")),
    db.select().from(inventoryItems).where(and(eq(inventoryItems.isActive, true), sql`quantity <= minimumStock`)),
    db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(revenues).where(
      sql`${revenues.date} >= ${`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`} AND ${revenues.date} <= ${`${currentYear}-${String(currentMonth).padStart(2, "0")}-31`}`
    ),
    db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(expenses).where(
      sql`${expenses.date} >= ${`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`} AND ${expenses.date} <= ${`${currentYear}-${String(currentMonth).padStart(2, "0")}-31`}`
    ),
  ]);

  return {
    totalEmployees: Number(totalEmployees[0]?.count || 0),
    activeContracts: Number(activeContracts[0]?.count || 0),
    expiringContracts: Number(expiringContracts[0]?.count || 0),
    todayAttendance: Number(todayAttendance[0]?.count || 0),
    lateToday: Number(lateToday[0]?.count || 0),
    earlyLeaveToday: Number(earlyLeaveToday[0]?.count || 0),
    openTasks: Number(openTasks[0]?.count || 0),
    overdueTasks: Number(overdueTasks[0]?.count || 0),
    lowStockCount: lowStockItems.length,
    monthRevenue: Number(monthRevenue[0]?.total || 0),
    monthExpenses: Number(monthExpenses[0]?.total || 0),
    netProfit: Number(monthRevenue[0]?.total || 0) - Number(monthExpenses[0]?.total || 0),
  };
}
