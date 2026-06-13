-- Branch-manager payroll workflow: overtime + adjustments and a two-stage
-- approval (Branch Manager review/approval -> Super Admin final approval).
-- Migration: 0007_branch_payroll

ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "overtimeHours" numeric(8, 2) DEFAULT '0';
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "overtimeAmount" numeric(12, 2) DEFAULT '0';
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "adjustments" numeric(12, 2) DEFAULT '0';
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "branchApprovedBy" integer;
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "branchApprovedAt" timestamp;
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "approvedBy" integer;
ALTER TABLE "payroll_records" ADD COLUMN IF NOT EXISTS "approvedAt" timestamp;
