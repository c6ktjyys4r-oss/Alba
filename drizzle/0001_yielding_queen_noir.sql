CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`checkIn` timestamp,
	`checkOut` timestamp,
	`status` enum('present','absent','late','early_leave','on_leave','holiday') NOT NULL DEFAULT 'present',
	`expectedCheckIn` timestamp,
	`expectedCheckOut` timestamp,
	`delayMinutes` int DEFAULT 0,
	`earlyLeaveMinutes` int DEFAULT 0,
	`notes` text,
	`adjustedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`address` text,
	`phone` varchar(50),
	`email` varchar(320),
	`managerName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`contractType` varchar(100),
	`startDate` date NOT NULL,
	`endDate` date,
	`status` enum('active','expired','pending_renewal','terminated') NOT NULL DEFAULT 'active',
	`salary` decimal(12,2),
	`notes` text,
	`fileUrl` text,
	`fileKey` varchar(500),
	`reminderSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`branchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500),
	`mimeType` varchar(100),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeCode` varchar(50),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`firstNameAr` varchar(100),
	`lastNameAr` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`nationalId` varchar(50),
	`dateOfBirth` date,
	`gender` enum('male','female','other'),
	`nationality` varchar(100),
	`address` text,
	`branchId` int,
	`departmentId` int,
	`jobTitle` varchar(255),
	`jobTitleAr` varchar(255),
	`erpRole` enum('super_admin','hr_manager','accountant','branch_manager','inventory_officer','department_manager','employee') NOT NULL DEFAULT 'employee',
	`hireDate` date,
	`status` enum('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`category` varchar(100) NOT NULL,
	`description` text,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'SAR',
	`date` date NOT NULL,
	`reference` varchar(100),
	`fileUrl` text,
	`fileKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemCode` varchar(50),
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`category` varchar(100),
	`unit` varchar(50),
	`branchId` int,
	`quantity` decimal(12,2) NOT NULL DEFAULT '0',
	`minimumStock` decimal(12,2) DEFAULT '0',
	`unitCost` decimal(12,2) DEFAULT '0',
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_items_itemCode_unique` UNIQUE(`itemCode`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`type` enum('stock_in','stock_out','transfer_in','transfer_out','adjustment') NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`fromBranchId` int,
	`toBranchId` int,
	`notes` text,
	`reference` varchar(100),
	`performedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`basicSalary` decimal(12,2) NOT NULL,
	`totalAllowances` decimal(12,2) DEFAULT '0',
	`totalDeductions` decimal(12,2) DEFAULT '0',
	`bonus` decimal(12,2) DEFAULT '0',
	`netSalary` decimal(12,2) NOT NULL,
	`status` enum('draft','approved','paid') NOT NULL DEFAULT 'draft',
	`notes` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `payroll_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int,
	`category` varchar(100) NOT NULL,
	`description` text,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'SAR',
	`date` date NOT NULL,
	`reference` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_structures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`basicSalary` decimal(12,2) NOT NULL,
	`housingAllowance` decimal(12,2) DEFAULT '0',
	`transportAllowance` decimal(12,2) DEFAULT '0',
	`otherAllowances` decimal(12,2) DEFAULT '0',
	`socialInsurance` decimal(12,2) DEFAULT '0',
	`taxDeduction` decimal(12,2) DEFAULT '0',
	`otherDeductions` decimal(12,2) DEFAULT '0',
	`currency` varchar(10) DEFAULT 'SAR',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salary_structures_id` PRIMARY KEY(`id`),
	CONSTRAINT `salary_structures_employeeId_unique` UNIQUE(`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`authorId` int,
	`content` text NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`assignedToEmployeeId` int,
	`assignedToDepartmentId` int,
	`assignedToBranchId` int,
	`createdBy` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` date,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
