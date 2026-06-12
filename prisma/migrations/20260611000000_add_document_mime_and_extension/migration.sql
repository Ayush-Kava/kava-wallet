-- AlterTable
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "file_extension" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "mime_type" TEXT NOT NULL DEFAULT 'application/octet-stream';
