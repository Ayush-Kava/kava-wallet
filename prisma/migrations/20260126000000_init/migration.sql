-- Initial migration translating prior Supabase schema to PostgreSQL managed by Prisma
-- Regenerate via `npx prisma migrate dev` after schema changes.

-- Enums
CREATE TYPE "AccountType" AS ENUM ('cash', 'bank', 'credit_card', 'wallet');
CREATE TYPE "CategoryType" AS ENUM ('income', 'expense');
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');
CREATE TYPE "RecurringType" AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE "RecurringFrequency" AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE "GoalPriority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE "InvestmentType" AS ENUM ('mutual_fund', 'stock', 'fd', 'gold', 'crypto');

-- Users and sessions
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- Accounts
CREATE TABLE "Account" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "color" TEXT NOT NULL DEFAULT '#10B981',
  "icon" TEXT NOT NULL DEFAULT 'wallet',
  "statement_start_date" DATE,
  "statement_end_date" DATE,
  "due_date" DATE,
  "credit_limit" DECIMAL(15,2),
  "min_due" DECIMAL(15,2),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Categories
CREATE TABLE "Category" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "User"("id") ON DELETE CASCADE,
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
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "description" TEXT,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "transfer_id" UUID
);
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");
CREATE INDEX "Transaction_transfer_id_idx" ON "Transaction"("transfer_id");

-- Budgets
CREATE TABLE "Budget" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE CASCADE,
  "amount" DECIMAL(15,2) NOT NULL,
  "period" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX "Budget_categoryId_idx" ON "Budget"("categoryId");

-- Loans
CREATE TABLE "Loan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "principal" DECIMAL(12,2) NOT NULL,
  "interest_rate" DECIMAL(5,2) NOT NULL,
  "tenure_months" INT NOT NULL,
  "emi_amount" DECIMAL(12,2) NOT NULL,
  "start_date" DATE NOT NULL,
  "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
  "outstanding_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");
CREATE INDEX "Loan_accountId_idx" ON "Loan"("accountId");
CREATE INDEX "Loan_categoryId_idx" ON "Loan"("categoryId");

-- Recurring rules
CREATE TABLE "RecurringRule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "RecurringType" NOT NULL,
  "frequency" "RecurringFrequency" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "accountId" UUID REFERENCES "Account"("id") ON DELETE CASCADE,
  "fromAccountId" UUID REFERENCES "Account"("id") ON DELETE CASCADE,
  "toAccountId" UUID REFERENCES "Account"("id") ON DELETE CASCADE,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
  "loanId" UUID REFERENCES "Loan"("id") ON DELETE CASCADE,
  "next_run_date" DATE NOT NULL,
  "end_date" DATE,
  "paused" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "RecurringRule_userId_idx" ON "RecurringRule"("userId");
CREATE INDEX "RecurringRule_next_run_date_idx" ON "RecurringRule"("next_run_date");
CREATE INDEX "RecurringRule_loanId_idx" ON "RecurringRule"("loanId");

-- Goals
CREATE TABLE "Goal" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
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
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "goalId" UUID NOT NULL REFERENCES "Goal"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "source_type" TEXT NOT NULL,
  "source_id" UUID NOT NULL,
  "allocated_amount" DECIMAL(15,2) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("goalId", "source_type", "source_id")
);
CREATE INDEX "GoalFunding_userId_idx" ON "GoalFunding"("userId");

-- Investments
CREATE TABLE "Investment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "InvestmentType" NOT NULL,
  "invested_amount" DECIMAL(15,2) NOT NULL,
  "current_value" DECIMAL(15,2) NOT NULL,
  "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
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
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "file_url" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_size" INT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_archived_idx" ON "Document"("archived");

CREATE TABLE "DocumentLink" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "linked_entity_type" TEXT NOT NULL,
  "linked_entity_id" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "DocumentLink_documentId_idx" ON "DocumentLink"("documentId");
CREATE INDEX "DocumentLink_userId_idx" ON "DocumentLink"("userId");
CREATE INDEX "DocumentLink_entity_idx" ON "DocumentLink"("linked_entity_type", "linked_entity_id");

CREATE TABLE "DocumentReminder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
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
CREATE INDEX "DocumentReminder_date_idx" ON "DocumentReminder"("reminder_date");
