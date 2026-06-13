import { describe, expect, it } from "vitest";
import { effectiveRoleOf, canManagerSeeRequest, computePayrollNet, type EffectiveRole } from "./db";
import type { Employee } from "../drizzle/schema";

function emp(p: Partial<Employee> & { id: number }): Employee {
  return {
    id: p.id,
    erpRole: p.erpRole ?? "employee",
    jobTitle: p.jobTitle ?? null,
    jobTitleAr: p.jobTitleAr ?? null,
    branchId: p.branchId ?? null,
  } as Employee;
}

describe("effectiveRoleOf", () => {
  it("maps super_admin erpRole to super_admin", () => {
    expect(effectiveRoleOf(emp({ id: 1, erpRole: "super_admin" }))).toBe("super_admin");
  });

  it("maps branch_manager erpRole to branch_manager", () => {
    expect(effectiveRoleOf(emp({ id: 2, erpRole: "branch_manager" }))).toBe("branch_manager");
  });

  it("recognises a branch manager by English job title", () => {
    expect(effectiveRoleOf(emp({ id: 3, jobTitle: "Branch Manager" }))).toBe("branch_manager");
  });

  it("recognises a branch manager by Arabic job title", () => {
    expect(effectiveRoleOf(emp({ id: 4, jobTitleAr: "مدير الفرع" }))).toBe("branch_manager");
  });

  it("collapses every other erpRole to employee", () => {
    for (const role of ["hr_manager", "accountant", "inventory_officer", "department_manager", "employee"] as const) {
      expect(effectiveRoleOf(emp({ id: 5, erpRole: role }))).toBe("employee");
    }
  });
});

describe("canManagerSeeRequest", () => {
  const superAdmin = { employeeId: 20, role: "super_admin" as EffectiveRole, branchId: 5 };
  const branchMgr = { employeeId: 4, role: "branch_manager" as EffectiveRole, branchId: 1 };
  const deptMgr = { employeeId: 6, role: "employee" as EffectiveRole, branchId: 1 };

  it("lets a super admin see requests from any branch", () => {
    expect(canManagerSeeRequest(superAdmin, { managerId: 99, requesterBranchId: 1 })).toBe(true);
    expect(canManagerSeeRequest(superAdmin, { managerId: null, requesterBranchId: 7 })).toBe(true);
  });

  it("lets a branch manager see any request from their own branch", () => {
    expect(canManagerSeeRequest(branchMgr, { managerId: 99, requesterBranchId: 1 })).toBe(true);
  });

  it("hides requests from other branches from a branch manager", () => {
    expect(canManagerSeeRequest(branchMgr, { managerId: 99, requesterBranchId: 2 })).toBe(false);
  });

  it("still lets a branch manager see requests routed directly to them", () => {
    expect(canManagerSeeRequest(branchMgr, { managerId: 4, requesterBranchId: 2 })).toBe(true);
  });

  it("limits a plain manager (e.g. department manager) to requests routed to them", () => {
    expect(canManagerSeeRequest(deptMgr, { managerId: 6, requesterBranchId: 1 })).toBe(true);
    expect(canManagerSeeRequest(deptMgr, { managerId: 99, requesterBranchId: 1 })).toBe(false);
  });
});

describe("computePayrollNet", () => {
  it("sums basic + allowances − deductions + bonus + overtime + adjustments", () => {
    const net = computePayrollNet({
      basicSalary: "5000",
      totalAllowances: "1500",
      totalDeductions: "500",
      bonus: "200",
      overtimeAmount: "300",
      adjustments: "-100",
    });
    expect(net).toBe(5000 + 1500 - 500 + 200 + 300 - 100);
  });
  it("handles null/undefined fields as zero", () => {
    const net = computePayrollNet({
      basicSalary: "3000",
      totalAllowances: null,
      totalDeductions: null,
      bonus: null,
      overtimeAmount: null,
      adjustments: null,
    });
    expect(net).toBe(3000);
  });
});
