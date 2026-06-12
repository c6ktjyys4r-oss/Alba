import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Branches ────────────────────────────────────────────────────────────────
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  managerName: varchar("managerName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  geofenceRadiusMeters: integer("geofenceRadiusMeters").default(100).notNull(),
  geofenceEnabled: boolean("geofenceEnabled").default(true).notNull(),
  workStartTime: varchar("workStartTime", { length: 5 }),
  workEndTime: varchar("workEndTime", { length: 5 }),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Riyadh").notNull(),
  lateGraceMinutes: integer("lateGraceMinutes").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;

// ─── Departments ─────────────────────────────────────────────────────────────
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  branchId: integer("branchId"),
  directManagerId: integer("directManagerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;

// ─── Employees ───────────────────────────────────────────────────────────────
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: varchar("employeeCode", { length: 50 }).unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  firstNameAr: varchar("firstNameAr", { length: 100 }),
  lastNameAr: varchar("lastNameAr", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  nationalId: varchar("nationalId", { length: 50 }),
  dateOfBirth: date("dateOfBirth"),
  gender: text("gender").$type<"male" | "female" | "other">(),
  nationality: varchar("nationality", { length: 100 }),
  address: text("address"),
  branchId: integer("branchId"),
  departmentId: integer("departmentId"),
  jobTitle: varchar("jobTitle", { length: 255 }),
  jobTitleAr: varchar("jobTitleAr", { length: 255 }),
  erpRole: text("erpRole").$type<
    "super_admin" |
    "hr_manager" |
    "accountant" |
    "branch_manager" |
    "inventory_officer" |
    "department_manager" |
    "employee"
  >().default("employee").notNull(),
  hireDate: date("hireDate"),
  status: text("status").$type<"active" | "inactive" | "on_leave" | "terminated">().default("active").notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;

// ─── Employee Documents ───────────────────────────────────────────────────────
export const employeeDocuments = pgTable("employee_documents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

// ─── Contracts ────────────────────────────────────────────────────────────────
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  contractType: varchar("contractType", { length: 100 }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  status: text("status").$type<"active" | "expired" | "pending_renewal" | "terminated">().default("active").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  notes: text("notes"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  reminderSent: boolean("reminderSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;

// ─── Salary Structures ────────────────────────────────────────────────────────
export const salaryStructures = pgTable("salary_structures", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull().unique(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  housingAllowance: decimal("housingAllowance", { precision: 12, scale: 2 }).default("0"),
  transportAllowance: decimal("transportAllowance", { precision: 12, scale: 2 }).default("0"),
  otherAllowances: decimal("otherAllowances", { precision: 12, scale: 2 }).default("0"),
  socialInsurance: decimal("socialInsurance", { precision: 12, scale: 2 }).default("0"),
  taxDeduction: decimal("taxDeduction", { precision: 12, scale: 2 }).default("0"),
  otherDeductions: decimal("otherDeductions", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SalaryStructure = typeof salaryStructures.$inferSelect;

// ─── Payroll Records ──────────────────────────────────────────────────────────
export const payrollRecords = pgTable("payroll_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  totalAllowances: decimal("totalAllowances", { precision: 12, scale: 2 }).default("0"),
  totalDeductions: decimal("totalDeductions", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("netSalary", { precision: 12, scale: 2 }).notNull(),
  status: text("status").$type<"draft" | "approved" | "paid">().default("draft").notNull(),
  notes: text("notes"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type PayrollRecord = typeof payrollRecords.$inferSelect;

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  status: text("status").$type<"present" | "absent" | "late" | "early_leave" | "on_leave" | "holiday">().default("present").notNull(),
  expectedCheckIn: timestamp("expectedCheckIn"),
  expectedCheckOut: timestamp("expectedCheckOut"),
  delayMinutes: integer("delayMinutes").default(0),
  earlyLeaveMinutes: integer("earlyLeaveMinutes").default(0),
  workedMinutes: integer("workedMinutes").default(0),
  branchId: integer("branchId"),
  notes: text("notes"),
  adjustedBy: integer("adjustedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;

// ─── Attendance Events (GPS Punch Log) ────────────────────────────────────────
export const attendanceEvents = pgTable("attendance_events", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  branchId: integer("branchId"),
  type: text("type").$type<"check_in" | "check_out">().notNull(),
  method: text("method").default("gps").notNull(),
  eventAt: timestamp("eventAt").defaultNow().notNull(),
  localDate: date("localDate").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  accuracyMeters: decimal("accuracyMeters", { precision: 8, scale: 2 }),
  distanceMeters: decimal("distanceMeters", { precision: 10, scale: 2 }),
  withinGeofence: boolean("withinGeofence").default(true).notNull(),
  accepted: boolean("accepted").default(true).notNull(),
  rejectionReason: varchar("rejectionReason", { length: 100 }),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendanceEvent = typeof attendanceEvents.$inferSelect;

// ─── Revenue ──────────────────────────────────────────────────────────────────
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  branchId: integer("branchId"),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Revenue = typeof revenues.$inferSelect;

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  branchId: integer("branchId"),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR"),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;

// ─── Inventory Items ──────────────────────────────────────────────────────────
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  itemCode: varchar("itemCode", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  branchId: integer("branchId"),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0").notNull(),
  minimumStock: decimal("minimumStock", { precision: 12, scale: 2 }).default("0"),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;

// ─── Inventory Transactions ───────────────────────────────────────────────────
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("itemId").notNull(),
  type: text("type").$type<"stock_in" | "stock_out" | "transfer_in" | "transfer_out" | "adjustment">().notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  fromBranchId: integer("fromBranchId"),
  toBranchId: integer("toBranchId"),
  notes: text("notes"),
  reference: varchar("reference", { length: 100 }),
  performedBy: integer("performedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignedToEmployeeId: integer("assignedToEmployeeId"),
  assignedToDepartmentId: integer("assignedToDepartmentId"),
  assignedToBranchId: integer("assignedToBranchId"),
  createdBy: integer("createdBy"),
  priority: text("priority").$type<"low" | "medium" | "high" | "urgent">().default("medium").notNull(),
  status: text("status").$type<"pending" | "in_progress" | "completed" | "overdue" | "cancelled">().default("pending").notNull(),
  dueDate: date("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;

// ─── Task Comments ────────────────────────────────────────────────────────────
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  authorId: integer("authorId"),
  content: text("content").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;

  // ─── Employee Credentials (Self-Service Portal) ───────────────────────────────
  export const employeeCredentials = pgTable("employee_credentials", {
    id: serial("id").primaryKey(),
    employeeId: integer("employeeId").notNull().unique(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
    lastLoginAt: timestamp("lastLoginAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  });
  export type EmployeeCredential = typeof employeeCredentials.$inferSelect;

  // ─── Leave Balances ───────────────────────────────────────────────────────────
  export const leaveBalances = pgTable("leave_balances", {
    id: serial("id").primaryKey(),
    employeeId: integer("employeeId").notNull(),
    year: integer("year").notNull(),
    annualDaysTotal: integer("annualDaysTotal").default(21).notNull(),
    annualDaysUsed: integer("annualDaysUsed").default(0).notNull(),
    sickDaysUsed: integer("sickDaysUsed").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  });
  export type LeaveBalance = typeof leaveBalances.$inferSelect;

  // ─── Employee Requests ────────────────────────────────────────────────────────
  export const employeeRequests = pgTable("employee_requests", {
    id: serial("id").primaryKey(),
    employeeId: integer("employeeId").notNull(),
    managerId: integer("managerId"),
    type: text("type").$type<"annual_leave" | "sick_leave" | "late_arrival" | "early_exit">().notNull(),
    status: text("status").$type<"pending" | "approved" | "rejected">().default("pending").notNull(),
    startDate: date("startDate"),
    endDate: date("endDate"),
    requestedDate: date("requestedDate"),
    requestedTime: varchar("requestedTime", { length: 10 }),
    shiftStartTime: varchar("shiftStartTime", { length: 10 }),
    reason: text("reason"),
    attachmentUrl: text("attachmentUrl"),
    attachmentKey: varchar("attachmentKey", { length: 500 }),
    daysRequested: integer("daysRequested"),
    managerComment: text("managerComment"),
    reviewedAt: timestamp("reviewedAt"),
    reviewedBy: integer("reviewedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  });
  export type EmployeeRequest = typeof employeeRequests.$inferSelect;

  // ─── Employee Notifications ───────────────────────────────────────────────────
  export const empNotifications = pgTable("emp_notifications", {
    id: serial("id").primaryKey(),
    recipientEmployeeId: integer("recipientEmployeeId").notNull(),
    senderEmployeeId: integer("senderEmployeeId"),
    requestId: integer("requestId"),
    type: text("type").$type<"request_submitted" | "request_approved" | "request_rejected" | "request_comment">().notNull(),
    message: text("message").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    sentViaEmail: boolean("sentViaEmail").default(false),
    sentViaWhatsapp: boolean("sentViaWhatsapp").default(false),
    sentViaSms: boolean("sentViaSms").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  });
  export type EmpNotification = typeof empNotifications.$inferSelect;
  