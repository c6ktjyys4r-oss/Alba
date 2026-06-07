CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"date" date NOT NULL,
	"checkIn" timestamp,
	"checkOut" timestamp,
	"status" text DEFAULT 'present' NOT NULL,
	"expectedCheckIn" timestamp,
	"expectedCheckOut" timestamp,
	"delayMinutes" integer DEFAULT 0,
	"earlyLeaveMinutes" integer DEFAULT 0,
	"notes" text,
	"adjustedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"nameAr" varchar(255),
	"address" text,
	"phone" varchar(50),
	"email" varchar(320),
	"managerName" varchar(255),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"contractType" varchar(100),
	"startDate" date NOT NULL,
	"endDate" date,
	"status" text DEFAULT 'active' NOT NULL,
	"salary" numeric(12, 2),
	"notes" text,
	"fileUrl" text,
	"fileKey" varchar(500),
	"reminderSent" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"nameAr" varchar(255),
	"branchId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" varchar(500),
	"mimeType" varchar(100),
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeCode" varchar(50),
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"firstNameAr" varchar(100),
	"lastNameAr" varchar(100),
	"email" varchar(320),
	"phone" varchar(50),
	"nationalId" varchar(50),
	"dateOfBirth" date,
	"gender" text,
	"nationality" varchar(100),
	"address" text,
	"branchId" integer,
	"departmentId" integer,
	"jobTitle" varchar(255),
	"jobTitleAr" varchar(255),
	"erpRole" text DEFAULT 'employee' NOT NULL,
	"hireDate" date,
	"status" text DEFAULT 'active' NOT NULL,
	"avatarUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employeeCode_unique" UNIQUE("employeeCode")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"branchId" integer,
	"category" varchar(100) NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SAR',
	"date" date NOT NULL,
	"reference" varchar(100),
	"fileUrl" text,
	"fileKey" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemCode" varchar(50),
	"name" varchar(255) NOT NULL,
	"nameAr" varchar(255),
	"category" varchar(100),
	"unit" varchar(50),
	"branchId" integer,
	"quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"minimumStock" numeric(12, 2) DEFAULT '0',
	"unitCost" numeric(12, 2) DEFAULT '0',
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_itemCode_unique" UNIQUE("itemCode")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemId" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"fromBranchId" integer,
	"toBranchId" integer,
	"notes" text,
	"reference" varchar(100),
	"performedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"basicSalary" numeric(12, 2) NOT NULL,
	"totalAllowances" numeric(12, 2) DEFAULT '0',
	"totalDeductions" numeric(12, 2) DEFAULT '0',
	"bonus" numeric(12, 2) DEFAULT '0',
	"netSalary" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"paidAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "revenues" (
	"id" serial PRIMARY KEY NOT NULL,
	"branchId" integer,
	"category" varchar(100) NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SAR',
	"date" date NOT NULL,
	"reference" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"basicSalary" numeric(12, 2) NOT NULL,
	"housingAllowance" numeric(12, 2) DEFAULT '0',
	"transportAllowance" numeric(12, 2) DEFAULT '0',
	"otherAllowances" numeric(12, 2) DEFAULT '0',
	"socialInsurance" numeric(12, 2) DEFAULT '0',
	"taxDeduction" numeric(12, 2) DEFAULT '0',
	"otherDeductions" numeric(12, 2) DEFAULT '0',
	"currency" varchar(10) DEFAULT 'SAR',
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "salary_structures_employeeId_unique" UNIQUE("employeeId")
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"authorId" integer,
	"content" text NOT NULL,
	"fileUrl" text,
	"fileKey" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"assignedToEmployeeId" integer,
	"assignedToDepartmentId" integer,
	"assignedToBranchId" integer,
	"createdBy" integer,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"dueDate" date,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
