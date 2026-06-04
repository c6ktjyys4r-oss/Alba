# Clinic ERP - Project TODO

## Core Infrastructure
- [x] Project scaffold (React 19 + Tailwind 4 + tRPC + MySQL)
- [x] Database schema (15 tables: branches, departments, employees, contracts, salary_structures, payroll_records, attendance, revenues, expenses, inventory_items, inventory_transactions, tasks, task_comments, employee_documents, users)
- [x] Full tRPC routers for all modules
- [x] Server-side query helpers (db.ts)
- [x] Bilingual i18n system (Arabic/English) with RTL support
- [x] ERP sidebar layout with collapsible navigation
- [x] Language toggle button (Arabic ↔ English)
- [x] RTL layout flip when Arabic is selected

## HR Module
- [x] Employee management (list, create, edit, delete, search, filter by status/branch)
- [x] Employee document upload (S3 storage)
- [x] Contract management (list, create, edit, delete, expiry tracking)
- [x] Payroll: salary structure setup (basic, allowances, deductions)
- [x] Payroll: monthly payroll generation and status management (draft/approved/paid)
- [x] Attendance tracking (daily records, check-in/out, status, delay/early leave)

## Accounting Module
- [x] Revenue management (list, create, edit, delete, filter by date/branch/category)
- [x] Expense management (list, create, edit, delete, filter by date/branch/category)
- [x] Financial overview (revenue vs expenses chart, net profit, category breakdown)

## Branch Management
- [x] Branch list, create, edit, delete
- [x] Department management (per branch)

## Inventory Module
- [x] Inventory items (list, create, edit, low-stock alerts)
- [x] Stock transactions (stock_in, stock_out, transfer, adjustment)
- [x] Transaction history log

## Task Management
- [x] Task list with status/priority filters
- [x] Create, edit, delete tasks
- [x] Task assignment (employee/department/branch)
- [x] Task comments
- [x] Quick status updates (pending → in_progress → completed)

## Reports & Analytics
- [x] HR report (employee status, attendance pie chart, payroll summary)
- [x] Financial report (revenue by branch bar chart)
- [x] Task report (task status pie chart)
- [x] Inventory report (low stock alerts, total value)
- [x] CSV export for all report types
- [x] Date range and branch filters

## AI Assistant
- [x] AI chat interface with message history
- [x] Context-aware responses (uses live dashboard stats)
- [x] Quick suggestion prompts
- [x] Arabic/English language-aware responses

## Dashboard
- [x] KPI cards (employees, contracts, attendance, tasks, revenue, expenses, profit, low stock)
- [x] Revenue vs Expenses bar chart (6-month)
- [x] Tasks overview donut chart
- [x] Attendance summary

## Testing
- [x] 25 vitest tests covering all routers (branches, employees, contracts, payroll, attendance, revenue, expenses, inventory, tasks, dashboard, AI, auth)
