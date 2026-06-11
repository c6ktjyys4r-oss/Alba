-- Employee Self-Service Portal: add 4 new tables
  -- Migration: 0002_emp_portal

  CREATE TABLE IF NOT EXISTS "employee_credentials" (
    "id" serial PRIMARY KEY,
    "employeeId" integer NOT NULL UNIQUE,
    "username" varchar(100) NOT NULL UNIQUE,
    "passwordHash" varchar(255) NOT NULL,
    "isActive" boolean NOT NULL DEFAULT true,
    "lastLoginAt" timestamp,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "leave_balances" (
    "id" serial PRIMARY KEY,
    "employeeId" integer NOT NULL,
    "year" integer NOT NULL,
    "annualDaysTotal" integer NOT NULL DEFAULT 21,
    "annualDaysUsed" integer NOT NULL DEFAULT 0,
    "sickDaysUsed" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    UNIQUE("employeeId", "year")
  );

  CREATE TABLE IF NOT EXISTS "employee_requests" (
    "id" serial PRIMARY KEY,
    "employeeId" integer NOT NULL,
    "managerId" integer,
    "type" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "startDate" date,
    "endDate" date,
    "requestedDate" date,
    "requestedTime" varchar(10),
    "shiftStartTime" varchar(10),
    "reason" text,
    "attachmentUrl" text,
    "attachmentKey" varchar(500),
    "daysRequested" integer,
    "managerComment" text,
    "reviewedAt" timestamp,
    "reviewedBy" integer,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "emp_notifications" (
    "id" serial PRIMARY KEY,
    "recipientEmployeeId" integer NOT NULL,
    "senderEmployeeId" integer,
    "requestId" integer,
    "type" text NOT NULL,
    "message" text NOT NULL,
    "isRead" boolean NOT NULL DEFAULT false,
    "sentViaEmail" boolean DEFAULT false,
    "sentViaWhatsapp" boolean DEFAULT false,
    "sentViaSms" boolean DEFAULT false,
    "createdAt" timestamp NOT NULL DEFAULT now()
  );
  