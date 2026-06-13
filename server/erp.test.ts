import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getBranches: vi.fn().mockResolvedValue([{ id: 1, name: "Main Branch", nameAr: "الفرع الرئيسي", isActive: true }]),
  getBranchById: vi.fn().mockResolvedValue({ id: 1, name: "Main Branch" }),
  createBranch: vi.fn().mockResolvedValue({ id: 2, name: "New Branch" }),
  updateBranch: vi.fn().mockResolvedValue({ id: 1, name: "Updated Branch" }),
  deleteBranch: vi.fn().mockResolvedValue({ success: true }),
  getDepartments: vi.fn().mockResolvedValue([{ id: 1, name: "HR", branchId: 1 }]),
  createDepartment: vi.fn().mockResolvedValue({ id: 2, name: "Finance" }),
  updateDepartment: vi.fn().mockResolvedValue({ id: 1, name: "HR Updated" }),
  deleteDepartment: vi.fn().mockResolvedValue({ success: true }),
  getEmployees: vi.fn().mockResolvedValue([{ id: 1, firstName: "John", lastName: "Doe", status: "active" }]),
  getEmployeeById: vi.fn().mockResolvedValue({ id: 1, firstName: "John", lastName: "Doe" }),
  createEmployee: vi.fn().mockResolvedValue({ id: 2, firstName: "Jane", lastName: "Smith" }),
  updateEmployee: vi.fn().mockResolvedValue({ id: 1, firstName: "John", lastName: "Updated" }),
  deleteEmployee: vi.fn().mockResolvedValue({ success: true }),
  getEmployeeDocuments: vi.fn().mockResolvedValue([]),
  addEmployeeDocument: vi.fn().mockResolvedValue({ id: 1 }),
  deleteEmployeeDocument: vi.fn().mockResolvedValue({ success: true }),
  getContracts: vi.fn().mockResolvedValue([{ id: 1, employeeId: 1, status: "active", startDate: "2024-01-01" }]),
  getContractById: vi.fn().mockResolvedValue({ id: 1, employeeId: 1 }),
  createContract: vi.fn().mockResolvedValue({ id: 2, employeeId: 1 }),
  updateContract: vi.fn().mockResolvedValue({ id: 1, status: "expired" }),
  deleteContract: vi.fn().mockResolvedValue({ success: true }),
  getSalaryStructure: vi.fn().mockResolvedValue({ employeeId: 1, basicSalary: "5000", housingAllowance: "1000", transportAllowance: "500", otherAllowances: "0", socialInsurance: "250", taxDeduction: "0", otherDeductions: "0" }),
  upsertSalaryStructure: vi.fn().mockResolvedValue({ employeeId: 1, basicSalary: "5000" }),
  getPayrollRecords: vi.fn().mockResolvedValue([{ id: 1, employeeId: 1, month: 3, year: 2026, netSalary: "6250", status: "draft" }]),
  createPayrollRecord: vi.fn().mockResolvedValue({ id: 2, netSalary: "6250" }),
  updatePayrollRecord: vi.fn().mockResolvedValue({ id: 1, status: "paid" }),
  getAttendance: vi.fn().mockResolvedValue([{ id: 1, employeeId: 1, date: "2026-03-12", status: "present" }]),
  createAttendanceRecord: vi.fn().mockResolvedValue({ id: 2, status: "present" }),
  updateAttendanceRecord: vi.fn().mockResolvedValue({ id: 1, status: "late" }),
  deleteAttendanceRecord: vi.fn().mockResolvedValue({ success: true }),
  getRevenues: vi.fn().mockResolvedValue([{ id: 1, amount: "1000", category: "Services", date: "2026-03-01" }]),
  createRevenue: vi.fn().mockResolvedValue({ id: 2, amount: "2000" }),
  updateRevenue: vi.fn().mockResolvedValue({ id: 1, amount: "1500" }),
  deleteRevenue: vi.fn().mockResolvedValue({ success: true }),
  getExpenses: vi.fn().mockResolvedValue([{ id: 1, amount: "500", category: "Rent", date: "2026-03-01" }]),
  createExpense: vi.fn().mockResolvedValue({ id: 2, amount: "300" }),
  updateExpense: vi.fn().mockResolvedValue({ id: 1, amount: "400" }),
  deleteExpense: vi.fn().mockResolvedValue({ success: true }),
  getInventoryItems: vi.fn().mockResolvedValue([{ id: 1, name: "Gloves", quantity: "100", minimumStock: "20" }]),
  getInventoryItemById: vi.fn().mockResolvedValue({ id: 1, name: "Gloves", quantity: "100", minimumStock: "20" }),
  createInventoryItem: vi.fn().mockResolvedValue({ id: 2, name: "Masks" }),
  updateInventoryItem: vi.fn().mockResolvedValue({ id: 1, quantity: "90" }),
  createInventoryTransaction: vi.fn().mockResolvedValue({ id: 1, type: "stock_out", quantity: "10" }),
  getInventoryTransactions: vi.fn().mockResolvedValue([]),
  getTasks: vi.fn().mockResolvedValue([{ id: 1, title: "Test Task", status: "pending", priority: "medium" }]),
  getTaskById: vi.fn().mockResolvedValue({ id: 1, title: "Test Task" }),
  createTask: vi.fn().mockResolvedValue({ id: 2, title: "New Task" }),
  updateTask: vi.fn().mockResolvedValue({ id: 1, status: "completed" }),
  deleteTask: vi.fn().mockResolvedValue({ success: true }),
  getTaskComments: vi.fn().mockResolvedValue([]),
  createTaskComment: vi.fn().mockResolvedValue({ id: 1, content: "Test comment" }),
  getDashboardStats: vi.fn().mockResolvedValue({ totalEmployees: 5, activeContracts: 3, expiringContracts: 1, todayAttendance: 4, lateToday: 1, overdueTasks: 0, lowStockCount: 2, monthRevenue: 10000, monthExpenses: 5000, netProfit: 5000 }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getManagerAccess: vi.fn().mockResolvedValue({ isManager: false, role: "employee", branchId: 1 }),
  getEmployeeCredential: vi.fn().mockResolvedValue({ employeeId: 1, username: "jdoe", passwordHash: "hash", isActive: true, mustChangePassword: false }),
  verifyPassword: vi.fn().mockReturnValue(true),
  updateEmployeeCredential: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "AI response" } }] }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/file.pdf", key: "test-key" }),
}));

function createAdminCtx(): TrpcContext {
  return {
    user: { id: 1, openId: "admin-user", email: "admin@clinic.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Branch Router", () => {
  it("lists branches", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.branch.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Main Branch");
  });

  it("creates a branch", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.branch.create({ name: "New Branch" });
    expect(result.id).toBe(2);
  });
});

describe("Employee Router", () => {
  it("lists employees", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.employee.list({});
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("John");
  });

  it("creates an employee", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.employee.create({ firstName: "Jane", lastName: "Smith" });
    expect(result.id).toBe(2);
  });
});

describe("Contract Router", () => {
  it("lists contracts", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.contract.list({});
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("active");
  });

  it("creates a contract", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.contract.create({ employeeId: 1, startDate: "2026-01-01", status: "active" });
    expect(result.id).toBe(2);
  });
});

describe("Payroll Router", () => {
  it("gets salary structure", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.payroll.getSalaryStructure({ employeeId: 1 });
    expect(result?.basicSalary).toBe("5000");
  });

  it("generates payroll from salary structure", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.payroll.generate({ employeeId: 1, month: 3, year: 2026 });
    expect(result).toBeDefined();
  });

  it("updates payroll status to paid", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.payroll.updateStatus({ id: 1, status: "paid" });
    expect(result).toBeDefined();
  });
});

describe("Attendance Router", () => {
  it("lists attendance records", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.attendance.list({});
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("present");
  });

  it("creates an attendance record", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.attendance.create({ employeeId: 1, date: "2026-03-13", status: "present" });
    expect(result.id).toBe(2);
  });
});

describe("Revenue Router", () => {
  it("lists revenues", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.revenue.list({});
    expect(result).toHaveLength(1);
    expect(Number(result[0].amount)).toBe(1000);
  });

  it("creates a revenue record", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.revenue.create({ category: "Services", amount: 2000, date: "2026-03-13" });
    expect(result.id).toBe(2);
  });
});

describe("Expense Router", () => {
  it("lists expenses", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.expense.list({});
    expect(result).toHaveLength(1);
  });

  it("creates an expense record", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.expense.create({ category: "Rent", amount: 300, date: "2026-03-13" });
    expect(result.id).toBe(2);
  });
});

describe("Inventory Router", () => {
  it("lists inventory items", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.inventory.list({});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Gloves");
  });

  it("records a stock_out transaction and updates quantity", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.inventory.stockTransaction({ itemId: 1, type: "stock_out", quantity: 10 });
    expect(result).toBeDefined();
  });
});

describe("Task Router", () => {
  it("lists tasks", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.task.list({});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Task");
  });

  it("creates a task", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.task.create({ title: "New Task", priority: "high" });
    expect(result.id).toBe(2);
  });
});

describe("Dashboard Router", () => {
  it("returns dashboard stats", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.dashboard.stats();
    expect(result?.totalEmployees).toBe(5);
    expect(result?.netProfit).toBe(5000);
  });
});

describe("AI Router", () => {
  it("returns AI chat response", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.ai.chat({ message: "What is the employee count?" });
    expect(result.message).toBe("AI response");
  });

  it("returns AI chat response in Arabic", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.ai.chat({ message: "كم عدد الموظفين؟", language: "ar" });
    expect(result.message).toBeDefined();
  });
});

describe("Auth Router", () => {
  it("returns the unified principal from me query", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.auth.me();
    // The legacy admin account maps to the super_admin principal in the unified app.
    expect(result?.name).toBe("Admin");
    expect(result?.role).toBe("super_admin");
  });

  it("returns an employee principal from an employee session", async () => {
    const ctx = {
      user: null,
      empEmployeeId: 1,
      req: { protocol: "https", headers: {} },
      res: { clearCookie: vi.fn(), cookie: vi.fn() },
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.employeeId).toBe(1);
    expect(result?.name).toBe("John Doe");
    expect(result?.role).toBe("employee");
    expect(result?.isManager).toBe(false);
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
