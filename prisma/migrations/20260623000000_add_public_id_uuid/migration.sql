-- Add UUID publicId columns for external-facing identifiers

ALTER TABLE "Bank" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Bank" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Bank" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Bank" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Bank_publicId_key" ON "Bank"("publicId");

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Account" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Account" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Account_publicId_key" ON "Account"("publicId");
CREATE INDEX IF NOT EXISTS "Account_userId_publicId_idx" ON "Account"("userId", "publicId");

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Category" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Category_publicId_key" ON "Category"("publicId");
CREATE INDEX IF NOT EXISTS "Category_userId_publicId_idx" ON "Category"("userId", "publicId");

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Transaction" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_publicId_key" ON "Transaction"("publicId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_publicId_idx" ON "Transaction"("userId", "publicId");

ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Budget" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Budget" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Budget" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_publicId_key" ON "Budget"("publicId");
CREATE INDEX IF NOT EXISTS "Budget_userId_publicId_idx" ON "Budget"("userId", "publicId");

ALTER TABLE "RecurringRule" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "RecurringRule" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "RecurringRule" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "RecurringRule" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "RecurringRule_publicId_key" ON "RecurringRule"("publicId");
CREATE INDEX IF NOT EXISTS "RecurringRule_userId_publicId_idx" ON "RecurringRule"("userId", "publicId");

ALTER TABLE "Loan" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Loan" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Loan" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Loan" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Loan_publicId_key" ON "Loan"("publicId");
CREATE INDEX IF NOT EXISTS "Loan_userId_publicId_idx" ON "Loan"("userId", "publicId");

ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Goal" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Goal" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Goal_publicId_key" ON "Goal"("publicId");
CREATE INDEX IF NOT EXISTS "Goal_userId_publicId_idx" ON "Goal"("userId", "publicId");

ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Investment" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Investment" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Investment" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Investment_publicId_key" ON "Investment"("publicId");
CREATE INDEX IF NOT EXISTS "Investment_userId_publicId_idx" ON "Investment"("userId", "publicId");

ALTER TABLE "GoalFunding" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "GoalFunding" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "GoalFunding" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "GoalFunding" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "GoalFunding_publicId_key" ON "GoalFunding"("publicId");
CREATE INDEX IF NOT EXISTS "GoalFunding_userId_publicId_idx" ON "GoalFunding"("userId", "publicId");

-- Migrate GoalFunding source_id to source_public_id (after Investment has publicId)
ALTER TABLE "GoalFunding" ADD COLUMN IF NOT EXISTS "source_public_id" UUID;
UPDATE "GoalFunding" gf SET "source_public_id" = (
  CASE gf.source_type
    WHEN 'account' THEN (SELECT a."publicId" FROM "Account" a WHERE a.id = gf.source_id)
    WHEN 'investment' THEN (SELECT i."publicId" FROM "Investment" i WHERE i.id = gf.source_id)
    ELSE gen_random_uuid()
  END
) WHERE gf."source_public_id" IS NULL AND gf.source_id IS NOT NULL;
ALTER TABLE "GoalFunding" DROP CONSTRAINT IF EXISTS "GoalFunding_goalId_source_type_source_id_key";
ALTER TABLE "GoalFunding" DROP COLUMN IF EXISTS "source_id";
ALTER TABLE "GoalFunding" ALTER COLUMN "source_public_id" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "GoalFunding_goalId_source_type_source_public_id_key"
  ON "GoalFunding"("goalId", "source_type", "source_public_id");

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "Document" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Document" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "Document_publicId_key" ON "Document"("publicId");
CREATE INDEX IF NOT EXISTS "Document_userId_publicId_idx" ON "Document"("userId", "publicId");

ALTER TABLE "DocumentLink" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "DocumentLink" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "DocumentLink" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "DocumentLink" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentLink_publicId_key" ON "DocumentLink"("publicId");

-- Migrate DocumentLink linked_entity_id to linked_entity_public_id
ALTER TABLE "DocumentLink" ADD COLUMN IF NOT EXISTS "linked_entity_public_id" UUID;
UPDATE "DocumentLink" dl SET "linked_entity_public_id" = (
  CASE dl.linked_entity_type
    WHEN 'account' THEN (SELECT a."publicId" FROM "Account" a WHERE a.id = dl.linked_entity_id)
    WHEN 'investment' THEN (SELECT i."publicId" FROM "Investment" i WHERE i.id = dl.linked_entity_id)
    WHEN 'loan' THEN (SELECT l."publicId" FROM "Loan" l WHERE l.id = dl.linked_entity_id)
    WHEN 'goal' THEN (SELECT g."publicId" FROM "Goal" g WHERE g.id = dl.linked_entity_id)
    WHEN 'transaction' THEN (SELECT t."publicId" FROM "Transaction" t WHERE t.id = dl.linked_entity_id)
    ELSE gen_random_uuid()
  END
) WHERE dl."linked_entity_public_id" IS NULL AND dl.linked_entity_id IS NOT NULL;
DROP INDEX IF EXISTS "DocumentLink_linked_entity_type_linked_entity_id_idx";
ALTER TABLE "DocumentLink" DROP COLUMN IF EXISTS "linked_entity_id";
ALTER TABLE "DocumentLink" ALTER COLUMN "linked_entity_public_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "DocumentLink_linked_entity_type_linked_entity_public_id_idx"
  ON "DocumentLink"("linked_entity_type", "linked_entity_public_id");

ALTER TABLE "DocumentReminder" ADD COLUMN IF NOT EXISTS "publicId" UUID;
UPDATE "DocumentReminder" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "DocumentReminder" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "DocumentReminder" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentReminder_publicId_key" ON "DocumentReminder"("publicId");
CREATE INDEX IF NOT EXISTS "DocumentReminder_userId_publicId_idx" ON "DocumentReminder"("userId", "publicId");
