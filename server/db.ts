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
  attendanceEvents,
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
import type { Employee, Department } from "../drizzle/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

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

// ─── Direct Manager Resolution ────────────────────────────────────────────────
// Single source of truth for "who is this employee's direct manager?".
// Used for both display (employee.me) and routing (submitRequest) so the manager
// an employee sees is always the manager their requests are actually routed to.

function isDentistEmployee(emp: Pick<Employee, "jobTitle" | "jobTitleAr">) {
  return /dentist/i.test(emp.jobTitle ?? "") || /أسنان|اسنان/.test(emp.jobTitleAr ?? "");
}

function isBranchManagerEmployee(emp: Pick<Employee, "erpRole" | "jobTitle" | "jobTitleAr">) {
  return (
    emp.erpRole === "branch_manager" ||
    /branch\s*manager/i.test(emp.jobTitle ?? "") ||
    /مدير\s*الفرع|مدير\s*فرع/.test(emp.jobTitleAr ?? "")
  );
}

// Pure resolver so it can be unit-tested without a database connection.
export function resolveDirectManagerIdSync(
  emp: Employee,
  all: Employee[],
  depts: Department[],
): number | null {
  const topManager = all.find((e) => e.erpRole === "super_admin") ?? null;

  const isTop = topManager ? emp.id === topManager.id : emp.erpRole === "super_admin";
  if (isTop) return null;

  let managerId: number | null = null;

  // Dentists report to their branch manager (overrides the department manager).
  if (isDentistEmployee(emp) && emp.branchId != null) {
    const branchManager = all.find(
      (e) => e.branchId === emp.branchId && e.id !== emp.id && isBranchManagerEmployee(e),
    );
    if (branchManager) managerId = branchManager.id;
  }

  // Otherwise fall back to the employee's department direct manager.
  if (managerId == null) {
    const dept = depts.find((d) => d.id === emp.departmentId) ?? null;
    if (dept?.directManagerId) managerId = dept.directManagerId;
  }

  // Ignore a self-referential mapping.
  if (managerId === emp.id) managerId = null;

  // Branch managers always roll up to the top manager; so does anyone still unresolved.
  if (topManager) {
    if (isBranchManagerEmployee(emp) || managerId == null) {
      managerId = topManager.id;
    }
  }

  if (managerId === emp.id) managerId = null;
  return managerId;
}

export async function resolveDirectManagerId(employeeId: number): Promise<number | null> {
  const emp = await getEmployeeById(employeeId);
  if (!emp) return null;
  const [all, depts] = await Promise.all([getEmployees(), getDepartments()]);
  return resolveDirectManagerIdSync(emp, all, depts);
}

// An employee is a "manager" if any active employee resolves to them as direct manager.
export async function isManagerEmployee(employeeId: number): Promise<boolean> {
  const [all, depts] = await Promise.all([getEmployees(), getDepartments()]);
  return all.some(
    (e) =>
      e.status === "active" &&
      e.id !== employeeId &&
      resolveDirectManagerIdSync(e, all, depts) === employeeId,
  );
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
export async function getAttendance(filters: { employeeId?: number; branchId?: number; date?: string; status?: string; startDate?: string; endDate?: string; dateFrom?: string; dateTo?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters.employeeId) conditions.push(eq(attendance.employeeId, filters.employeeId));
  if (filters.branchId) conditions.push(eq(attendance.branchId, filters.branchId));
  if (filters.status) conditions.push(eq(attendance.status, filters.status as any));
  if (filters.date) conditions.push(eq(attendance.date, filters.date));
  const from = filters.dateFrom ?? filters.startDate;
  const to = filters.dateTo ?? filters.endDate;
  if (from) conditions.push(sql`${attendance.date} >= ${from}`);
  if (to) conditions.push(sql`${attendance.date} <= ${to}`);

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

// ─── Attendance: GPS Geofence & Events ────────────────────────────────────────

const EARTH_RADIUS_M = 6371000;

// Great-circle distance in meters between two lat/lng points.
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

function hhmmToMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(mm)) return null;
  return h * 60 + mm;
}

// Minute-of-day (0..1439) for an instant, evaluated in the given IANA timezone.
function minutesOfDay(d: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  let h = 0;
  let mm = 0;
  for (const p of parts) {
    if (p.type === "hour") h = parseInt(p.value, 10);
    if (p.type === "minute") mm = parseInt(p.value, 10);
  }
  return h * 60 + mm;
}

// Offset (minutes) of a timezone at a given instant. Riyadh => +180.
function tzOffsetMinutes(timezone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
  }
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return Math.round((asUTC - at.getTime()) / 60000);
}

// UTC instant for a wall-clock "HH:MM" on localDate in the given timezone.
function localTimeToTimestamp(localDate: string, hhmm: string | null | undefined, timezone: string): Date | null {
  const min = hhmmToMinutes(hhmm);
  if (min == null) return null;
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  const guess = new Date(`${localDate}T${hh}:${mm}:00Z`);
  const offset = tzOffsetMinutes(timezone, guess);
  return new Date(guess.getTime() - offset * 60000);
}

// Current local date (YYYY-MM-DD) and minute-of-day in a timezone.
export function nowInTimezone(timezone: string = "Asia/Riyadh"): { localDate: string; minutesOfDay: number; now: Date } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const localDate = `${get("year")}-${get("month")}-${get("day")}`;
  const minutes = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
  return { localDate, minutesOfDay: minutes, now };
}

export async function createAttendanceEvent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(attendanceEvents).values(data).returning();
  return row;
}

export async function getAttendanceEventsForDay(employeeId: number, localDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(attendanceEvents)
    .where(and(eq(attendanceEvents.employeeId, employeeId), eq(attendanceEvents.localDate, localDate)))
    .orderBy(asc(attendanceEvents.eventAt));
}

export async function getAttendanceEvents(
  filters: {
    employeeId?: number;
    branchId?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    startDate?: string;
    endDate?: string;
    accepted?: boolean;
    withinGeofence?: boolean;
  } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const from = filters.dateFrom ?? filters.startDate;
  const to = filters.dateTo ?? filters.endDate;
  const conditions: any[] = [];
  if (filters.employeeId) conditions.push(eq(attendanceEvents.employeeId, filters.employeeId));
  if (filters.branchId) conditions.push(eq(attendanceEvents.branchId, filters.branchId));
  if (filters.date) conditions.push(eq(attendanceEvents.localDate, filters.date));
  if (from) conditions.push(sql`${attendanceEvents.localDate} >= ${from}`);
  if (to) conditions.push(sql`${attendanceEvents.localDate} <= ${to}`);
  if (filters.accepted !== undefined) conditions.push(eq(attendanceEvents.accepted, filters.accepted));
  if (filters.withinGeofence !== undefined) conditions.push(eq(attendanceEvents.withinGeofence, filters.withinGeofence));
  const query = db.select().from(attendanceEvents);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(attendanceEvents.eventAt));
  }
  return query.orderBy(desc(attendanceEvents.eventAt));
}

export async function getEmployeeAttendanceHistory(
  employeeId: number,
  opts: { dateFrom?: string; dateTo?: string; limit?: number } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(attendance.employeeId, employeeId)];
  if (opts.dateFrom) conditions.push(sql`${attendance.date} >= ${opts.dateFrom}`);
  if (opts.dateTo) conditions.push(sql`${attendance.date} <= ${opts.dateTo}`);
  let q: any = db.select().from(attendance).where(and(...conditions)).orderBy(desc(attendance.date));
  if (opts.limit) q = q.limit(opts.limit);
  return q;
}

// Recompute the daily attendance summary row from accepted GPS events.
export async function recomputeDailyAttendance(employeeId: number, localDate: string) {
  const db = await getDb();
  if (!db) return null;

  const emp = await getEmployeeById(employeeId);
  const branchId = emp?.branchId ?? null;
  const branch = branchId ? await getBranchById(branchId) : null;
  const tz = branch?.timezone || "Asia/Riyadh";

  const events = await db
    .select()
    .from(attendanceEvents)
    .where(
      and(
        eq(attendanceEvents.employeeId, employeeId),
        eq(attendanceEvents.localDate, localDate),
        eq(attendanceEvents.accepted, true)
      )
    )
    .orderBy(asc(attendanceEvents.eventAt));

  const checkIns = events.filter((e: any) => e.type === "check_in");
  const checkOuts = events.filter((e: any) => e.type === "check_out");
  const firstIn: Date | null = checkIns.length ? checkIns[0].eventAt : null;
  const lastOut: Date | null = checkOuts.length ? checkOuts[checkOuts.length - 1].eventAt : null;

  let status = "present";
  let delayMinutes = 0;
  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;

  const grace = branch?.lateGraceMinutes ?? 5;
  const wsm = hhmmToMinutes(branch?.workStartTime);
  const wem = hhmmToMinutes(branch?.workEndTime);

  if (firstIn && wsm != null) {
    const im = minutesOfDay(firstIn, tz);
    if (im > wsm + grace) {
      status = "late";
      delayMinutes = im - wsm;
    }
  }
  if (lastOut && wem != null) {
    const om = minutesOfDay(lastOut, tz);
    if (om < wem) {
      earlyLeaveMinutes = wem - om;
      if (status === "present") status = "early_leave";
    }
  }
  if (firstIn && lastOut) {
    workedMinutes = Math.max(0, Math.round((lastOut.getTime() - firstIn.getTime()) / 60000));
  }

  const row = {
    employeeId,
    branchId,
    date: localDate,
    checkIn: firstIn,
    checkOut: lastOut,
    status: status as any,
    delayMinutes,
    earlyLeaveMinutes,
    workedMinutes,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, localDate)))
    .limit(1);

  if (existing) {
    const [updated] = await db.update(attendance).set(row).where(eq(attendance.id, existing.id)).returning();
    return updated;
  }
  const [inserted] = await db.insert(attendance).values(row).returning();
  return inserted;
}

// Admin manual create of a daily attendance record (times entered as "HH:MM").
export async function createAttendanceRecord(data: {
  employeeId: number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  branchId?: number | null;
  notes?: string | null;
  delayMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const emp = await getEmployeeById(data.employeeId);
  const branchId = data.branchId ?? emp?.branchId ?? null;
  const branch = branchId ? await getBranchById(branchId) : null;
  const tz = branch?.timezone || "Asia/Riyadh";

  const checkIn = localTimeToTimestamp(data.date, data.checkIn, tz);
  const checkOut = localTimeToTimestamp(data.date, data.checkOut, tz);

  let delayMinutes = 0;
  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;
  const grace = branch?.lateGraceMinutes ?? 5;
  const wsm = hhmmToMinutes(branch?.workStartTime);
  const wem = hhmmToMinutes(branch?.workEndTime);
  if (checkIn && wsm != null) {
    const im = minutesOfDay(checkIn, tz);
    if (im > wsm + grace) delayMinutes = im - wsm;
  }
  if (checkOut && wem != null) {
    const om = minutesOfDay(checkOut, tz);
    if (om < wem) earlyLeaveMinutes = wem - om;
  }
  if (checkIn && checkOut) {
    workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
  }

  const [row] = await db
    .insert(attendance)
    .values({
      employeeId: data.employeeId,
      branchId,
      date: data.date,
      checkIn,
      checkOut,
      status: (data.status ?? "present") as any,
      delayMinutes: data.delayMinutes ?? delayMinutes,
      earlyLeaveMinutes: data.earlyLeaveMinutes ?? earlyLeaveMinutes,
      workedMinutes,
      notes: data.notes ?? null,
    })
    .returning();
  return row;
}

export async function updateAttendanceRecord(
  id: number,
  data: {
    date?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status?: string;
    branchId?: number | null;
    notes?: string | null;
    delayMinutes?: number | null;
    earlyLeaveMinutes?: number | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [existing] = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
  if (!existing) throw new Error("Attendance record not found");

  const date = data.date ?? existing.date;
  const emp = await getEmployeeById(existing.employeeId);
  const branchId = data.branchId ?? existing.branchId ?? emp?.branchId ?? null;
  const branch = branchId ? await getBranchById(branchId) : null;
  const tz = branch?.timezone || "Asia/Riyadh";

  const checkIn =
    data.checkIn !== undefined ? localTimeToTimestamp(date, data.checkIn, tz) : (existing.checkIn as Date | null);
  const checkOut =
    data.checkOut !== undefined ? localTimeToTimestamp(date, data.checkOut, tz) : (existing.checkOut as Date | null);

  let delayMinutes = 0;
  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;
  const grace = branch?.lateGraceMinutes ?? 5;
  const wsm = hhmmToMinutes(branch?.workStartTime);
  const wem = hhmmToMinutes(branch?.workEndTime);
  if (checkIn && wsm != null) {
    const im = minutesOfDay(checkIn, tz);
    if (im > wsm + grace) delayMinutes = im - wsm;
  }
  if (checkOut && wem != null) {
    const om = minutesOfDay(checkOut, tz);
    if (om < wem) earlyLeaveMinutes = wem - om;
  }
  if (checkIn && checkOut) {
    workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
  }

  const [row] = await db
    .update(attendance)
    .set({
      date,
      branchId,
      checkIn,
      checkOut,
      status: (data.status ?? existing.status) as any,
      delayMinutes: data.delayMinutes ?? delayMinutes,
      earlyLeaveMinutes: data.earlyLeaveMinutes ?? earlyLeaveMinutes,
      workedMinutes,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(attendance.id, id))
    .returning();
  return row;
}

export async function deleteAttendanceRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(attendance).where(eq(attendance.id, id)).returning();
}

// Record a GPS punch. ALWAYS logs an event (audit); accepts only if within geofence.
export async function recordGpsPunch(input: {
  employeeId: number;
  type: "check_in" | "check_out";
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  method?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const emp = await getEmployeeById(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  const branch = emp.branchId ? await getBranchById(emp.branchId) : null;
  const tz = branch?.timezone || "Asia/Riyadh";
  const { localDate } = nowInTimezone(tz);

  const radius = branch?.geofenceRadiusMeters ?? 100;
  const geofenceEnabled = branch?.geofenceEnabled ?? true;
  const hasBranchGeo = !!(branch && branch.latitude != null && branch.longitude != null);
  const hasPunchCoords = input.latitude != null && input.longitude != null;

  let distanceMeters: number | null = null;
  let withinGeofence = false;
  let rejectionReason: string | null = null;

  if (!branch) {
    rejectionReason = "no_branch_assigned";
  } else if (!geofenceEnabled) {
    // Branch is exempt from GPS geofencing (e.g. management / remote staff):
    // accept the punch regardless of location. Distance is recorded for audit
    // only when both the branch and the punch have coordinates.
    if (hasBranchGeo && hasPunchCoords) {
      distanceMeters = haversineMeters(
        input.latitude as number,
        input.longitude as number,
        Number(branch.latitude),
        Number(branch.longitude)
      );
    }
    withinGeofence = true;
  } else if (!hasBranchGeo) {
    rejectionReason = "branch_not_configured";
  } else if (!hasPunchCoords) {
    rejectionReason = "location_required";
  } else {
    distanceMeters = haversineMeters(
      input.latitude as number,
      input.longitude as number,
      Number(branch.latitude),
      Number(branch.longitude)
    );
    withinGeofence = distanceMeters <= radius;
    if (!withinGeofence) rejectionReason = "out_of_range";
  }

  let accepted = withinGeofence;
  if (accepted) {
    const todays = await getAttendanceEventsForDay(input.employeeId, localDate);
    const acc = todays.filter((e: any) => e.accepted);
    const ins = acc.filter((e: any) => e.type === "check_in").length;
    const outs = acc.filter((e: any) => e.type === "check_out").length;
    const currentlyCheckedIn = ins > outs;
    if (input.type === "check_in" && currentlyCheckedIn) {
      accepted = false;
      rejectionReason = "already_checked_in";
    } else if (input.type === "check_out" && !currentlyCheckedIn) {
      accepted = false;
      rejectionReason = "not_checked_in";
    }
  }

  const event = await createAttendanceEvent({
    employeeId: input.employeeId,
    branchId: branch?.id ?? null,
    type: input.type,
    method: input.method ?? "gps",
    eventAt: new Date(),
    localDate,
    latitude: input.latitude != null ? String(input.latitude) : null,
    longitude: input.longitude != null ? String(input.longitude) : null,
    accuracyMeters: input.accuracyMeters != null ? String(input.accuracyMeters) : null,
    distanceMeters: distanceMeters != null ? String(distanceMeters) : null,
    withinGeofence,
    accepted,
    rejectionReason,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  if (accepted) {
    await recomputeDailyAttendance(input.employeeId, localDate);
  }

  return {
    event,
    accepted,
    withinGeofence,
    distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
    rejectionReason,
    radius,
    localDate,
    timezone: tz,
  };
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

    export async function getEmployeeCredentialByEmpId(employeeId: number) {
      const db = await getDb();
      if (!db) return null;
      const r = await db.select().from(employeeCredentials).where(eq(employeeCredentials.employeeId, employeeId));
      return r[0] || null;
    }

    export async function changeEmployeePassword(employeeId: number, newPlain: string) {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.update(employeeCredentials)
        .set({ passwordHash: hashPassword(newPlain), mustChangePassword: false, updatedAt: new Date() })
        .where(eq(employeeCredentials.employeeId, employeeId))
        .returning();
    }

    export async function provisionAllEmployeeCredentials(): Promise<{ provisioned: number; skipped: number; errors: string[] }> {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const allEmps = await db.select().from(employees).where(eq(employees.status, "active"));
      const existing = await db.select({ employeeId: employeeCredentials.employeeId }).from(employeeCredentials);
      const existingSet = new Set(existing.map((c: any) => c.employeeId));
      let provisioned = 0, skipped = 0;
      const errors: string[] = [];
      for (const emp of allEmps) {
        if (existingSet.has(emp.id)) { skipped++; continue; }
        if (!emp.nationalId?.trim()) { skipped++; continue; }
        const username = emp.nationalId.trim();
        try {
          await db.insert(employeeCredentials).values({
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
  