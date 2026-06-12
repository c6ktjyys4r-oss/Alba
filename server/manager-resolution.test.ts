import { describe, expect, it } from "vitest";
import { resolveDirectManagerIdSync } from "./db";
import type { Employee, Department } from "../drizzle/schema";

// Minimal employee factory — the resolver only reads id, erpRole, branchId,
// departmentId, jobTitle, jobTitleAr and status.
function emp(p: Partial<Employee> & { id: number }): Employee {
  return {
    id: p.id,
    firstName: p.firstName ?? `E${p.id}`,
    lastName: p.lastName ?? "",
    branchId: p.branchId ?? null,
    departmentId: p.departmentId ?? null,
    jobTitle: p.jobTitle ?? null,
    jobTitleAr: p.jobTitleAr ?? null,
    erpRole: p.erpRole ?? "employee",
    status: p.status ?? "active",
  } as Employee;
}

function dept(id: number, branchId: number | null, directManagerId: number | null): Department {
  return { id, name: `D${id}`, branchId, directManagerId } as Department;
}

// Mirrors the production org: branch 1 (Algadeer), branch 5 (Management).
const TOP = emp({ id: 20, firstName: "Bader", erpRole: "super_admin", branchId: 5, departmentId: 4 });
const AHMED = emp({ id: 4, firstName: "Ahmed", jobTitle: "Branch Manager", branchId: 1, departmentId: 1 });
const ALHANOUF = emp({ id: 6, firstName: "Alhanouf", branchId: 1, departmentId: 1 });
const HADI = emp({ id: 8, firstName: "Hadi", jobTitle: "General dentist ", branchId: 1, departmentId: 2 });
const NURSE = emp({ id: 11, firstName: "Nurse", branchId: 1, departmentId: 3 });
const ROSELYN = emp({ id: 10, firstName: "Roselyn", branchId: 1, departmentId: 3 });

const EMPLOYEES = [TOP, AHMED, ALHANOUF, HADI, NURSE, ROSELYN];
const DEPARTMENTS = [
  dept(1, 1, 6), // Administrative -> Alhanouf
  dept(2, 1, null), // Dental -> none (the bug)
  dept(3, 1, 10), // Nursing -> Roselyn
  dept(4, 5, 20), // Management -> Bader
];

const resolve = (e: Employee) => resolveDirectManagerIdSync(e, EMPLOYEES, DEPARTMENTS);

describe("resolveDirectManagerIdSync", () => {
  it("routes a dentist with no department manager to the branch manager (the Hadi case)", () => {
    expect(resolve(HADI)).toBe(AHMED.id);
  });

  it("routes an employee to their department's direct manager", () => {
    expect(resolve(NURSE)).toBe(ROSELYN.id);
  });

  it("routes a branch manager up to the top manager", () => {
    expect(resolve(AHMED)).toBe(TOP.id);
  });

  it("returns null for the top manager (no one above)", () => {
    expect(resolve(TOP)).toBeNull();
  });

  it("never returns the employee themselves (self-manager dept rolls up to top)", () => {
    // Alhanouf is the direct manager of her own department (id 1).
    expect(resolve(ALHANOUF)).toBe(TOP.id);
    // Roselyn manages her own department (Nursing, id 3).
    expect(resolve(ROSELYN)).toBe(TOP.id);
  });

  it("falls back to the top manager when a dentist's branch has no branch manager", () => {
    const lonelyDentist = emp({ id: 99, jobTitle: "dentist", branchId: 7, departmentId: 2 });
    expect(resolveDirectManagerIdSync(lonelyDentist, [...EMPLOYEES, lonelyDentist], DEPARTMENTS)).toBe(TOP.id);
  });

  it("falls back to the top manager for an employee with no department", () => {
    const orphan = emp({ id: 98, branchId: 1, departmentId: null });
    expect(resolveDirectManagerIdSync(orphan, [...EMPLOYEES, orphan], DEPARTMENTS)).toBe(TOP.id);
  });

  it("recognizes a branch manager by Arabic job title", () => {
    const arBm = emp({ id: 50, jobTitleAr: "مدير الفرع", branchId: 1, departmentId: 1 });
    const dentist = emp({ id: 51, jobTitle: "dentist", branchId: 1, departmentId: 2 });
    const employees = [TOP, arBm, dentist];
    expect(resolveDirectManagerIdSync(dentist, employees, DEPARTMENTS)).toBe(arBm.id);
  });

  it("returns null when there is no top manager and nothing else resolves", () => {
    const loner = emp({ id: 70, branchId: 9, departmentId: null });
    expect(resolveDirectManagerIdSync(loner, [loner], [])).toBeNull();
  });
});
