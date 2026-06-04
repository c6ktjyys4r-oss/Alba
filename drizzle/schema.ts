import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Branches ────────────────────────────────────────────────────────────────
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  managerName: varchar("managerName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;

// ─── Departments ─────────────────────────────────────────────────────────────
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  branchId: int("branchId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;

// ─── Employees ───────────────────────────────────────────────────────────────
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  employeeCode: varchar("employeeCode", { length: 50 }).unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  firstNameAr: varchar("firstNameAr", { length: 100 }),
  lastNameAr: varchar("lastNameAr", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  nationalId: varchar("nationalId", { length: 50 }),
  dateOfBirth: date("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  nationality: varchar("nationality", { length: 100 }),
  address: text("address"),
  branchId: int("branchId"),
  departmentId: int("departmentId"),
  jobTitle: varchar("jobTitle", { length: 255 }),
  jobTitleAr: varchar("jobTitleAr", { length: 255 }),
  erpRole: mysqlEnum("erpRole", [
    "super_admin",
    "hr_manager",
    "accountant",
    "branch_manager",
    "inventory_officer",
    "department_manager",
    "employee",
  ]).default("employee").notNull(),
  hireDate: date("hireDate"),
  status: mysqlEnum("status", ["active", "inactive", "on_leave", "terminated"]).default("active").notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;

// ─── Employee Documents ───────────────────────────────────────────────────────
export const employeeDocuments = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

// ─── Contracts ────────────────────────────────────────────────────────────────
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  contractType: varchar("contractType", { length: 100 }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "expired", "pending_renewal", "terminated"]).default("active").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  notes: text("notes"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  reminderSent: boolean("reminderSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;

// ─── Salary Structures ────────────────────────────────────────────────────────
export const salaryStructures = mysqlTable("salary_structures", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  housingAllowance: decimal("housingAllowance", { precision: 12, scale: 2 }).default("0"),
  transportAllowance: decimal("transportAllowance", { precision: 12, scale: 2 }).default("0"),
  otherAllowances: decimal("otherAllowances", { precision: 12, scale: 2 }).default("0"),
  socialInsurance: decimal("socialInsurance", { precision: 12, scale: 2 }).default("0"),
  taxDeduction: decimal("taxDeduction", { precision: 12, scale: 2 }).default("0"),
  otherDeductions: decimal("otherDeductions", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalaryStructure = typeof salaryStructures.$inferSelect;

// ─── Payroll Records ──────────────────────────────────────────────────────────
export const payrollRecords = mysqlTable("payroll_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  totalAllowances: decimal("totalAllowances", { precision: 12, scale: 2 }).default("0"),
  totalDeductions: decimal("totalDeductions", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("netSalary", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "approved", "paid"]).default("draft").notNull(),
  notes: text("notes"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type PayrollRecord = typeof payrollRecords.$inferSelect;

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  status: mysqlEnum("status", ["present", "absent", "late", "early_leave", "on_leave", "holiday"]).default("present").notNull(),
  expectedCheckIn: timestamp("expectedCheckIn"),
  expectedCheckOut: timestamp("expectedCheckOut"),
  delayMinutes: int("delayMinutes").default(0),
  earlyLeaveMinutes: int("earlyLeaveMinutes").default(0),
  notes: text("notes"),
  adjustedBy: int("adjustedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;

// ─── Revenue ──────────────────────────────────────────────────────────────────
export const revenues = mysqlTable("revenues", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Revenue = typeof revenues.$inferSelect;

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;

// ─── Inventory Items ──────────────────────────────────────────────────────────
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  itemCode: varchar("itemCode", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  branchId: int("branchId"),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0").notNull(),
  minimumStock: decimal("minimumStock", { precision: 12, scale: 2 }).default("0"),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;

// ─── Inventory Transactions ───────────────────────────────────────────────────
export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  type: mysqlEnum("type", ["stock_in", "stock_out", "transfer_in", "transfer_out", "adjustment"]).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  fromBranchId: int("fromBranchId"),
  toBranchId: int("toBranchId"),
  notes: text("notes"),
  reference: varchar("reference", { length: 100 }),
  performedBy: int("performedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignedToEmployeeId: int("assignedToEmployeeId"),
  assignedToDepartmentId: int("assignedToDepartmentId"),
  assignedToBranchId: int("assignedToBranchId"),
  createdBy: int("createdBy"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "overdue", "cancelled"]).default("pending").notNull(),
  dueDate: date("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;

// ─── Task Comments ────────────────────────────────────────────────────────────
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  authorId: int("authorId"),
  content: text("content").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
