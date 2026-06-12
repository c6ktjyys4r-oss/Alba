-- GPS Attendance: geofence fields on branches, summary fields on attendance, and the attendance_events punch log
-- Migration: 0004_gps_attendance

ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "geofenceRadiusMeters" integer DEFAULT 100 NOT NULL;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "workStartTime" varchar(5);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "workEndTime" varchar(5);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "timezone" varchar(64) DEFAULT 'Asia/Riyadh' NOT NULL;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "lateGraceMinutes" integer DEFAULT 5 NOT NULL;

ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "workedMinutes" integer DEFAULT 0;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "branchId" integer;

CREATE TABLE IF NOT EXISTS "attendance_events" (
  "id" serial PRIMARY KEY,
  "employeeId" integer NOT NULL,
  "branchId" integer,
  "type" text NOT NULL,
  "method" text NOT NULL DEFAULT 'gps',
  "eventAt" timestamp NOT NULL DEFAULT now(),
  "localDate" date NOT NULL,
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "accuracyMeters" numeric(8, 2),
  "distanceMeters" numeric(10, 2),
  "withinGeofence" boolean NOT NULL DEFAULT true,
  "accepted" boolean NOT NULL DEFAULT true,
  "rejectionReason" varchar(100),
  "metadata" jsonb,
  "ipAddress" varchar(64),
  "userAgent" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "attendance_events_emp_date_idx" ON "attendance_events" ("employeeId", "localDate");
CREATE INDEX IF NOT EXISTS "attendance_events_branch_idx" ON "attendance_events" ("branchId", "eventAt");
