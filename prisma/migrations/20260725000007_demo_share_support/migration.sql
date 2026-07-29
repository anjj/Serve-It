-- AlterTable on Customer and File
ALTER TABLE "Customer" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "File" ADD COLUMN "expiresAt" TIMESTAMPTZ(3);

-- CreateIndex on File
CREATE INDEX "File_expiresAt_idx" ON "File"("expiresAt");

-- CreateTable demo_upload_log
CREATE TABLE "demo_upload_log" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_upload_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on demo_upload_log
CREATE INDEX "demo_upload_log_ipHash_createdAt_idx" ON "demo_upload_log"("ipHash", "createdAt");

-- WI-2: Enable RLS on demo_upload_log with zero policies (deny-all posture)
ALTER TABLE "demo_upload_log" ENABLE ROW LEVEL SECURITY;

-- Revoke all grants from anon, authenticated roles on the new table
REVOKE ALL ON TABLE "demo_upload_log" FROM anon, authenticated;
