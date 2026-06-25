-- Full schema redesign: separate account tables, bank master, auto-increment integer PKs.
-- WARNING: This drops all existing data. Re-run seed after applying.

-- Drop existing tables (dependency order)
DROP TABLE IF EXISTS "DocumentReminder" CASCADE;
DROP TABLE IF EXISTS "DocumentLink" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "GoalFunding" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "Investment" CASCADE;
DROP TABLE IF EXISTS "RecurringRule" CASCADE;
DROP TABLE IF EXISTS "Loan" CASCADE;
DROP TABLE IF EXISTS "Budget" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "CreditCard" CASCADE;
DROP TABLE IF EXISTS "WalletAccount" CASCADE;
DROP TABLE IF EXISTS "CashAccount" CASCADE;
DROP TABLE IF EXISTS "BankAccount" CASCADE;
DROP TABLE IF EXISTS "Bank" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "AccountType" CASCADE;
DROP TYPE IF EXISTS "AccountKind" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "CategoryType" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "RecurringType" CASCADE;
DROP TYPE IF EXISTS "RecurringFrequency" CASCADE;
DROP TYPE IF EXISTS "GoalPriority" CASCADE;
DROP TYPE IF EXISTS "GoalStatus" CASCADE;
DROP TYPE IF EXISTS "InvestmentType" CASCADE;

-- Enums
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "AccountKind" AS ENUM ('bank', 'cash', 'wallet', 'credit_card');
CREATE TYPE "CategoryType" AS ENUM ('income', 'expense');
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');
CREATE TYPE "RecurringType" AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE "RecurringFrequency" AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE "GoalPriority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE "InvestmentType" AS ENUM ('mutual_fund', 'stock', 'fd', 'gold', 'crypto');

-- Users and sessions
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Session" (
  "id" SERIAL PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- Bank master (admin-managed)
CREATE TABLE "Bank" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "ifscPrefix" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Type-specific account tables
CREATE TABLE "BankAccount" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bankId" INTEGER NOT NULL REFERENCES "Bank"("id") ON DELETE RESTRICT,
  "name" TEXT NOT NULL,
  "accountNumber" BIGINT NOT NULL,
  "ifscCode" VARCHAR(11) NOT NULL,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "color" TEXT NOT NULL DEFAULT '#10B981',
  "icon" TEXT NOT NULL DEFAULT 'landmark',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");
CREATE INDEX "BankAccount_bankId_idx" ON "BankAccount"("bankId");

CREATE TABLE "CashAccount" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "color" TEXT NOT NULL DEFAULT '#10B981',
  "icon" TEXT NOT NULL DEFAULT 'banknote',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "CashAccount_userId_idx" ON "CashAccount"("userId");

CREATE TABLE "WalletAccount" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "color" TEXT NOT NULL DEFAULT '#5F259F',
  "icon" TEXT NOT NULL DEFAULT 'smartphone',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "WalletAccount_userId_idx" ON "WalletAccount"("userId");

CREATE TABLE "CreditCard" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bankId" INTEGER REFERENCES "Bank"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "cardNumber" TEXT NOT NULL,
  "cardHolderName" TEXT,
  "expiryDate" DATE NOT NULL,
  "creditLimit" DECIMAL(15,2) NOT NULL,
  "outstandingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "minDue" DECIMAL(15,2),
  "statementStartDate" DATE,
  "statementEndDate" DATE,
  "dueDate" DATE,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "color" TEXT NOT NULL DEFAULT '#1A1F71',
  "icon" TEXT NOT NULL DEFAULT 'credit-card',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "CreditCard_userId_idx" ON "CreditCard"("userId");
CREATE INDEX "CreditCard_bankId_idx" ON "CreditCard"("bankId");

-- Unified ledger pointer for transactions and related modules
CREATE TABLE "Account" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "kind" "AccountKind" NOT NULL,
  "referenceId" INTEGER NOT NULL,
  CONSTRAINT "Account_kind_referenceId_key" UNIQUE ("kind", "referenceId")
);
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Categories
CREATE TABLE "Category" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "CategoryType" NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'tag',
  "color" TEXT NOT NULL DEFAULT '#6366F1',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- Transactions
CREATE TABLE "Transaction" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "accountId" INTEGER NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
  "categoryId" INTEGER REFERENCES "Category"("id") ON DELETE SET NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "description" TEXT,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "transfer_id" INTEGER
);
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");
CREATE INDEX "Transaction_transfer_id_idx" ON "Transaction"("transfer_id");

-- Budgets
CREATE TABLE "Budget" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "categoryId" INTEGER REFERENCES "Category"("id") ON DELETE CASCADE,
  "amount" DECIMAL(15,2) NOT NULL,
  "period" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX "Budget_categoryId_idx" ON "Budget"("categoryId");

-- Recurring rules
CREATE TABLE "RecurringRule" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "RecurringType" NOT NULL,
  "frequency" "RecurringFrequency" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "accountId" INTEGER REFERENCES "Account"("id") ON DELETE CASCADE,
  "fromAccountId" INTEGER REFERENCES "Account"("id") ON DELETE CASCADE,
  "toAccountId" INTEGER REFERENCES "Account"("id") ON DELETE CASCADE,
  "categoryId" INTEGER REFERENCES "Category"("id") ON DELETE SET NULL,
  "loanId" INTEGER,
  "next_run_date" DATE NOT NULL,
  "end_date" DATE,
  "paused" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "RecurringRule_userId_idx" ON "RecurringRule"("userId");
CREATE INDEX "RecurringRule_next_run_date_idx" ON "RecurringRule"("next_run_date");
CREATE INDEX "RecurringRule_loanId_idx" ON "RecurringRule"("loanId");

-- Loans
CREATE TABLE "Loan" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "principal" DECIMAL(12,2) NOT NULL,
  "interest_rate" DECIMAL(5,2) NOT NULL,
  "tenure_months" INTEGER NOT NULL,
  "emi_amount" DECIMAL(12,2) NOT NULL,
  "start_date" DATE NOT NULL,
  "accountId" INTEGER NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT,
  "categoryId" INTEGER REFERENCES "Category"("id") ON DELETE SET NULL,
  "outstanding_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");
CREATE INDEX "Loan_accountId_idx" ON "Loan"("accountId");
CREATE INDEX "Loan_categoryId_idx" ON "Loan"("categoryId");

ALTER TABLE "RecurringRule"
  ADD CONSTRAINT "RecurringRule_loanId_fkey"
  FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE;

-- Goals
CREATE TABLE "Goal" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "target_amount" DECIMAL(15,2) NOT NULL,
  "target_date" DATE NOT NULL,
  "priority" "GoalPriority" NOT NULL DEFAULT 'medium',
  "status" "GoalStatus" NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_status_idx" ON "Goal"("status");
CREATE INDEX "Goal_priority_idx" ON "Goal"("priority");
CREATE INDEX "Goal_target_date_idx" ON "Goal"("target_date");

CREATE TABLE "GoalFunding" (
  "id" SERIAL PRIMARY KEY,
  "goalId" INTEGER NOT NULL REFERENCES "Goal"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "source_type" TEXT NOT NULL,
  "source_id" INTEGER NOT NULL,
  "allocated_amount" DECIMAL(15,2) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "GoalFunding_goalId_source_type_source_id_key" UNIQUE ("goalId", "source_type", "source_id")
);
CREATE INDEX "GoalFunding_userId_idx" ON "GoalFunding"("userId");

-- Investments
CREATE TABLE "Investment" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "InvestmentType" NOT NULL,
  "invested_amount" DECIMAL(15,2) NOT NULL,
  "current_value" DECIMAL(15,2) NOT NULL,
  "accountId" INTEGER NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
  "start_date" TIMESTAMPTZ NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");
CREATE INDEX "Investment_accountId_idx" ON "Investment"("accountId");
CREATE INDEX "Investment_type_idx" ON "Investment"("type");

-- Documents
CREATE TABLE "Document" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "file_url" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_extension" TEXT NOT NULL DEFAULT '',
  "mime_type" TEXT NOT NULL DEFAULT 'application/octet-stream',
  "file_size" INTEGER NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_archived_idx" ON "Document"("archived");

CREATE TABLE "DocumentLink" (
  "id" SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "linked_entity_type" TEXT NOT NULL,
  "linked_entity_id" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "DocumentLink_documentId_idx" ON "DocumentLink"("documentId");
CREATE INDEX "DocumentLink_userId_idx" ON "DocumentLink"("userId");
CREATE INDEX "DocumentLink_linked_entity_type_linked_entity_id_idx" ON "DocumentLink"("linked_entity_type", "linked_entity_id");

CREATE TABLE "DocumentReminder" (
  "id" SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reminder_type" TEXT NOT NULL,
  "reminder_date" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "DocumentReminder_documentId_idx" ON "DocumentReminder"("documentId");
CREATE INDEX "DocumentReminder_userId_idx" ON "DocumentReminder"("userId");
CREATE INDEX "DocumentReminder_reminder_date_idx" ON "DocumentReminder"("reminder_date");
