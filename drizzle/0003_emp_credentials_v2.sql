-- Migration 0003: Add mustChangePassword to employee_credentials
  ALTER TABLE "employee_credentials"
    ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT true;
  