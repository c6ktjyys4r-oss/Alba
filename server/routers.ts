import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { localAuth } from "./_core/localAuth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Branch Router ────────────────────────────────────────────────────────────
const branchRouter = router({
  list: protectedProcedure.query(() => db.getBranches()),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getBranchById(input.id)),
  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    managerName: z.string().optional(),
  })).mutation(({ input }) => db.createBranch(input)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    nameAr: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    managerName: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateBranch(id, data); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteBranch(input.id)),
});

// ─── Department Router ────────────────────────────────────────────────────────
const departmentRouter = router({
  list: protectedProcedure.input(z.object({ branchId: z.number().optional() }).optional()).query(({ input }) => db.getDepartments(input?.branchId)),
  create: protectedProcedure.input(z.object({ name: z.string().min(1), nameAr: z.string().optional(), branchId: z.number().optional() })).mutation(({ input }) => db.createDepartment(input)),
  update: protectedProcedure.input(z.object({ id: z.number(), name: z.string().optional(), nameAr: z.string().optional(), branchId: z.number().optional() })).mutation(({ input }) => { const { id, ...data } = input; return db.updateDepartment(id, data); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteDepartment(input.id)),
});

// ─── Employee Router ──────────────────────────────────────────────────────────
const employeeRouter = router({
  list: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    departmentId: z.number().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }).optional()).query(({ input }) => db.getEmployees(input || {})),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getEmployeeById(input.id)),
  create: protectedProcedure.input(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    branchId: z.number().optional(),
    departmentId: z.number().optional(),
    jobTitle: z.string().optional(),
    jobTitleAr: z.string().optional(),
    erpRole: z.enum(["super_admin", "hr_manager", "accountant", "branch_manager", "inventory_officer", "department_manager", "employee"]).optional(),
    hireDate: z.string().optional(),
    status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
    employeeCode: z.string().optional(),
  })).mutation(({ input }) => db.createEmployee(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    branchId: z.number().optional(),
    departmentId: z.number().optional(),
    jobTitle: z.string().optional(),
    jobTitleAr: z.string().optional(),
    erpRole: z.enum(["super_admin", "hr_manager", "accountant", "branch_manager", "inventory_officer", "department_manager", "employee"]).optional(),
    hireDate: z.string().optional(),
    status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
    employeeCode: z.string().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateEmployee(id, data as any); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteEmployee(input.id)),
  getDocuments: protectedProcedure.input(z.object({ employeeId: z.number() })).query(({ input }) => db.getEmployeeDocuments(input.employeeId)),
  uploadDocument: protectedProcedure.input(z.object({
    employeeId: z.number(),
    name: z.string(),
    fileBase64: z.string(),
    mimeType: z.string(),
    fileName: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.fileBase64, "base64");
    const key = `employee-docs/${input.employeeId}/${nanoid()}-${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    return db.addEmployeeDocument({ employeeId: input.employeeId, name: input.name, fileUrl: url, fileKey: key, mimeType: input.mimeType });
  }),
  deleteDocument: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteEmployeeDocument(input.id)),
});

// ─── Contract Router ──────────────────────────────────────────────────────────
const contractRouter = router({
  list: protectedProcedure.input(z.object({ employeeId: z.number().optional(), status: z.string().optional() }).optional()).query(({ input }) => db.getContracts(input || {})),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getContractById(input.id)),
  create: protectedProcedure.input(z.object({
    employeeId: z.number(),
    contractType: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    status: z.enum(["active", "expired", "pending_renewal", "terminated"]).optional(),
    salary: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(({ input }) => db.createContract(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    contractType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(["active", "expired", "pending_renewal", "terminated"]).optional(),
    salary: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateContract(id, data as any); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteContract(input.id)),
});

// ─── Payroll Router ───────────────────────────────────────────────────────────
const payrollRouter = router({
  getSalaryStructure: protectedProcedure.input(z.object({ employeeId: z.number() })).query(({ input }) => db.getSalaryStructure(input.employeeId)),
  upsertSalaryStructure: protectedProcedure.input(z.object({
    employeeId: z.number(),
    basicSalary: z.number(),
    housingAllowance: z.number().optional(),
    transportAllowance: z.number().optional(),
    otherAllowances: z.number().optional(),
    taxDeduction: z.number().optional(),
    otherDeductions: z.number().optional(),
    currency: z.string().optional(),
  })).mutation(({ input }) => db.upsertSalaryStructure(input as any)),
  list: protectedProcedure.input(z.object({
    employeeId: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(({ input }) => db.getPayrollRecords(input || {})),
  generate: protectedProcedure.input(z.object({
    employeeId: z.number(),
    month: z.number(),
    year: z.number(),
    bonus: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    const structure = await db.getSalaryStructure(input.employeeId);
    if (!structure) throw new Error("No salary structure found for employee");
    const employee = await db.getEmployeeById(input.employeeId);
    const isSaudi = (employee?.nationality ?? "").toLowerCase().includes("saudi");
    const basic = Number(structure.basicSalary);
    const housing = Number(structure.housingAllowance);
    const gosiSalary = basic + housing;
    const gosiEmployeeDeduction = isSaudi ? Math.round(gosiSalary * 9.75) / 100 : 0;
    const gosiEmployerContribution = isSaudi ? Math.round(gosiSalary * 11.75) / 100 : Math.round(gosiSalary * 2) / 100;
    const allowances = housing + Number(structure.transportAllowance) + Number(structure.otherAllowances);
    const deductions = gosiEmployeeDeduction + Number(structure.taxDeduction) + Number(structure.otherDeductions);
    const bonus = input.bonus || 0;
    const net = basic + allowances - deductions + bonus;
    return db.createPayrollRecord({
      employeeId: input.employeeId,
      month: input.month,
      year: input.year,
      basicSalary: String(basic),
      totalAllowances: String(allowances),
      totalDeductions: String(deductions),
      bonus: String(bonus),
      netSalary: String(net),
      notes: input.notes,
    } as any);
  }),
  updateStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["draft", "approved", "paid"]) })).mutation(({ input }) => db.updatePayrollRecord(input.id, { status: input.status, paidAt: input.status === "paid" ? new Date() : undefined })),
});

// ─── Attendance Router ────────────────────────────────────────────────────────
const attendanceRouter = router({
  list: protectedProcedure.input(z.object({
    employeeId: z.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.string().optional(),
    branchId: z.number().optional(),
  }).optional()).query(({ input }) => db.getAttendance(input || {})),
  create: protectedProcedure.input(z.object({
    employeeId: z.number(),
    date: z.string(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(["present", "absent", "late", "early_leave", "on_leave", "holiday"]),
    delayMinutes: z.number().optional(),
    earlyLeaveMinutes: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(({ input }) => db.createAttendanceRecord(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(["present", "absent", "late", "early_leave", "on_leave", "holiday"]).optional(),
    delayMinutes: z.number().optional(),
    earlyLeaveMinutes: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateAttendanceRecord(id, data as any); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteAttendanceRecord(input.id)),
});

// ─── Revenue Router ───────────────────────────────────────────────────────────
const revenueRouter = router({
  list: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional(),
  }).optional()).query(({ input }) => db.getRevenues(input || {})),
  create: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    category: z.string().min(1),
    description: z.string().optional(),
    amount: z.number(),
    date: z.string(),
    reference: z.string().optional(),
  })).mutation(({ input }) => db.createRevenue(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    branchId: z.number().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().optional(),
    date: z.string().optional(),
    reference: z.string().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateRevenue(id, data as any); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteRevenue(input.id)),
});

// ─── Expense Router ───────────────────────────────────────────────────────────
const expenseRouter = router({
  list: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional(),
  }).optional()).query(({ input }) => db.getExpenses(input || {})),
  create: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    category: z.string().min(1),
    description: z.string().optional(),
    amount: z.number(),
    date: z.string(),
    reference: z.string().optional(),
  })).mutation(({ input }) => db.createExpense(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    branchId: z.number().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().optional(),
    date: z.string().optional(),
    reference: z.string().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateExpense(id, data as any); }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteExpense(input.id)),
});

// ─── Inventory Router ─────────────────────────────────────────────────────────
const inventoryRouter = router({
  list: protectedProcedure.input(z.object({
    branchId: z.number().optional(),
    category: z.string().optional(),
    lowStock: z.boolean().optional(),
    search: z.string().optional(),
  }).optional()).query(({ input }) => db.getInventoryItems(input || {})),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getInventoryItemById(input.id)),
  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    itemCode: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().optional(),
    branchId: z.number().optional(),
    quantity: z.number().optional(),
    minimumStock: z.number().optional(),
    unitCost: z.number().optional(),
    description: z.string().optional(),
  })).mutation(({ input }) => db.createInventoryItem(input as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    nameAr: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().optional(),
    branchId: z.number().optional(),
    quantity: z.number().optional(),
    minimumStock: z.number().optional(),
    unitCost: z.number().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(({ input }) => { const { id, ...data } = input; return db.updateInventoryItem(id, data as any); }),
  stockTransaction: protectedProcedure.input(z.object({
    itemId: z.number(),
    type: z.enum(["stock_in", "stock_out", "transfer_in", "transfer_out", "adjustment"]),
    quantity: z.number(),
    fromBranchId: z.number().optional(),
    toBranchId: z.number().optional(),
    notes: z.string().optional(),
    reference: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const item = await db.getInventoryItemById(input.itemId);
    if (!item) throw new Error("Item not found");
    let newQty = Number(item.quantity);
    if (input.type === "stock_in" || input.type === "transfer_in") newQty += input.quantity;
    else if (input.type === "stock_out" || input.type === "transfer_out") newQty -= input.quantity;
    else newQty = input.quantity;
    await db.updateInventoryItem(input.itemId, { quantity: String(newQty) } as any);
    return db.createInventoryTransaction({ ...input, quantity: String(input.quantity) } as any);
  }),
  transactions: protectedProcedure.input(z.object({ itemId: z.number().optional(), branchId: z.number().optional() }).optional()).query(({ input }) => db.getInventoryTransactions(input?.itemId, input?.branchId)),
});

// ─── Task Router ──────────────────────────────────────────────────────────────
const taskRouter = router({
  list: protectedProcedure.input(z.object({
    employeeId: z.number().optional(),
    departmentId: z.number().optional(),
    branchId: z.number().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
  }).optional()).query(({ input }) => db.getTasks(input || {})),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getTaskById(input.id)),
  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assignedToEmployeeId: z.number().optional(),
    assignedToDepartmentId: z.number().optional(),
    assignedToBranchId: z.number().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.string().optional(),
  })).mutation(({ input, ctx }) => db.createTask({ ...input, createdBy: ctx.user?.id } as any)),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    assignedToEmployeeId: z.number().optional(),
    assignedToDepartmentId: z.number().optional(),
    assignedToBranchId: z.number().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z.enum(["pending", "in_progress", "completed", "overdue", "cancelled"]).optional(),
    dueDate: z.string().optional(),
  })).mutation(({ input }) => {
    const { id, ...data } = input;
    const updateData: any = { ...data };
    if (data.status === "completed") updateData.completedAt = new Date();
    return db.updateTask(id, updateData);
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteTask(input.id)),
  getComments: protectedProcedure.input(z.object({ taskId: z.number() })).query(({ input }) => db.getTaskComments(input.taskId)),
  addComment: protectedProcedure.input(z.object({ taskId: z.number(), content: z.string().min(1) })).mutation(({ input, ctx }) => db.createTaskComment({ ...input, authorId: ctx.user?.id })),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(() => db.getDashboardStats()),
});

// ─── AI Assistant Router ──────────────────────────────────────────────────────
const aiRouter = router({
  chat: protectedProcedure.input(z.object({
    message: z.string().min(1),
    language: z.enum(["en", "ar"]).optional(),
  })).mutation(async ({ input }) => {
    const stats = await db.getDashboardStats();
    const employees = await db.getEmployees({ status: "active" });
    const lowStock = await db.getInventoryItems({ lowStock: true });
    const overdueTasks = await db.getTasks({ status: "overdue" });

    const systemPrompt = input.language === "ar"
      ? `أنت مساعد ذكي لنظام ERP لإدارة المنظمات. لديك الوصول إلى البيانات التالية:
- إجمالي الموظفين النشطين: ${stats?.totalEmployees || 0}
- العقود النشطة: ${stats?.activeContracts || 0}
- العقود المنتهية قريباً: ${stats?.expiringContracts || 0}
- حضور اليوم: ${stats?.todayAttendance || 0}
- التأخيرات اليوم: ${stats?.lateToday || 0}
- المهام المتأخرة: ${stats?.overdueTasks || 0}
- عناصر المخزون المنخفض: ${stats?.lowStockCount || 0}
- إيرادات الشهر: ${stats?.monthRevenue || 0}
- مصروفات الشهر: ${stats?.monthExpenses || 0}
- صافي الربح: ${stats?.netProfit || 0}
أجب باللغة العربية فقط.`
      : `You are an intelligent AI assistant for an ERP management system. You have access to the following data:
- Active employees: ${stats?.totalEmployees || 0}
- Active contracts: ${stats?.activeContracts || 0}
- Contracts expiring soon: ${stats?.expiringContracts || 0}
- Today's attendance records: ${stats?.todayAttendance || 0}
- Late arrivals today: ${stats?.lateToday || 0}
- Overdue tasks: ${stats?.overdueTasks || 0}
- Low stock items: ${stats?.lowStockCount || 0}
- This month's revenue: ${stats?.monthRevenue || 0}
- This month's expenses: ${stats?.monthExpenses || 0}
- Net profit: ${stats?.netProfit || 0}
Provide concise, actionable insights.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message },
      ],
    });
    return { message: response.choices[0]?.message?.content || "No response" };
  }),
});

// ─── Import Router ──────────────────────────────────────────────────────────
const importRouter = router({
  importStaff: protectedProcedure.input(z.object({
    staffData: z.array(z.object({
      "Full name english": z.string(),
      "الاسم كامل عربي": z.string().optional(),
      "nationality ": z.string().optional(),
      "ID #": z.string().optional(),
      "Date of Birth": z.string().optional(),
      "phone #": z.string().optional(),
      "Email ": z.string().optional(),
      "Address": z.string().optional(),
      "Job title": z.string().optional(),
      "Departement": z.string().optional(),
    }))
  })).mutation(async ({ input }) => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      // Get or create main branch
      const branches = await db.getBranches();
      let mainBranchId = branches?.[0]?.id;
      
      if (!mainBranchId) {
        const newBranch = await db.createBranch({ name: "Main Branch", address: "Riyadh" });
        mainBranchId = (newBranch as any)[0]?.id;
      }

      // Process each staff record
      for (const staff of input.staffData) {
        try {
          const fullNameEn = staff["Full name english"] || "";
          const nameParts = fullNameEn.trim().split(/\s+/);
          const firstName = nameParts[0] || "Unknown";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          const firstNameAr = staff["الاسم كامل عربي"]?.split(" ")[0] || "";
          const lastNameAr = staff["الاسم كامل عربي"]?.split(" ").slice(1).join(" ") || "";
          
          const email = staff["Email "]?.trim() || null;
          const phone = staff["phone #"]?.toString() || null;
          const nationalId = staff["ID #"]?.toString() || null;
          const dateOfBirth = staff["Date of Birth"] ? staff["Date of Birth"].split(" ")[0] : null;
          const nationality = staff["nationality "] || null;
          const address = staff["Address"] || null;
          const jobTitle = staff["Job title"] || null;
          const departmentName = staff["Departement"] || "General";

          // Get or create department
          const departments = await db.getDepartments(mainBranchId);
          let departmentId = departments?.find((d: any) => d.name === departmentName)?.id;
          
          if (!departmentId) {
            const newDept = await db.createDepartment({ name: departmentName, branchId: mainBranchId });
            departmentId = (newDept as any)[0]?.id;
          }

          // Check if employee exists
          const employees = await db.getEmployees({ search: email || undefined });
          if (employees?.some((e: any) => e.email === email)) {
            skipped++;
            continue;
          }

          // Create employee
          await db.createEmployee({

            firstName,
            lastName,
            firstNameAr,
            lastNameAr,
            email: email || undefined,
            phone: phone || undefined,
            nationalId: nationalId || undefined,
            dateOfBirth: dateOfBirth || undefined,
            nationality: nationality || undefined,
            address: address || undefined,
            branchId: mainBranchId,
            departmentId,
            jobTitle: jobTitle || undefined,
            erpRole: "employee",
            hireDate: dateOfBirth || undefined,
            status: "active",
          } as any);

          imported++;
        } catch (error: any) {
          errors.push(`Error importing ${staff["Full name english"]}: ${error.message}`);
        }
      }

      return {
        imported,
        skipped,
        total: input.staffData.length,
        errors,
      };
    } catch (error: any) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const result = await localAuth.login(input.username, input.password);
      if (!result) {
        throw new Error("Invalid username or password");
      }
      localAuth.setSessionCookie(ctx.res, ctx.req, result.token);
      return result.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  branch: branchRouter,
  department: departmentRouter,
  employee: employeeRouter,
  contract: contractRouter,
  payroll: payrollRouter,
  attendance: attendanceRouter,
  revenue: revenueRouter,
  expense: expenseRouter,
  inventory: inventoryRouter,
  task: taskRouter,
  dashboard: dashboardRouter,
  ai: aiRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;
