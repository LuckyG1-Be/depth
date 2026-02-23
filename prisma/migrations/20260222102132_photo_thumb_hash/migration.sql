/*
  Warnings:

  - You are about to drop the `EmailOtp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhoneOtp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `reason` on the `Block` table. All the data in the column will be lost.
  - You are about to drop the column `blockImmediately` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `evidence` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `includeLastMessages` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `reasonCode` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `fpHash` on the `SecurityEvent` table. All the data in the column will be lost.
  - You are about to drop the column `ipHash` on the `SecurityEvent` table. All the data in the column will be lost.
  - You are about to drop the column `uaHash` on the `SecurityEvent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DeviceFingerprint_fpHash_userId_key";

-- DropIndex
DROP INDEX "DeviceFingerprint_userId_lastSeenAt_idx";

-- DropIndex
DROP INDEX "EmailOtp_expiresAt_idx";

-- DropIndex
DROP INDEX "EmailOtp_email_key";

-- DropIndex
DROP INDEX "PhoneOtp_phone_key";

-- DropIndex
DROP INDEX "PhoneOtp_expiresAt_idx";

-- DropIndex
DROP INDEX "PhoneOtp_phone_idx";

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "aHash" TEXT;
ALTER TABLE "Photo" ADD COLUMN "contentHash" TEXT;
ALTER TABLE "Photo" ADD COLUMN "thumbPath" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailOtp";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhoneOtp";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Block" ("blockedId", "blockerId", "createdAt", "id") SELECT "blockedId", "blockerId", "createdAt", "id" FROM "Block";
DROP TABLE "Block";
ALTER TABLE "new_Block" RENAME TO "Block";
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'OTHER',
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "details", "id", "reportedId", "reporterId", "status") SELECT "createdAt", "details", "id", "reportedId", "reporterId", "status" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
CREATE INDEX "Report_reportedId_createdAt_idx" ON "Report"("reportedId", "createdAt");
CREATE TABLE "new_SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SecurityEvent" ("createdAt", "id", "meta", "scoreDelta", "severity", "type", "userId") SELECT "createdAt", "id", "meta", "scoreDelta", "severity", "type", "userId" FROM "SecurityEvent";
DROP TABLE "SecurityEvent";
ALTER TABLE "new_SecurityEvent" RENAME TO "SecurityEvent";
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DeviceFingerprint_fpHash_idx" ON "DeviceFingerprint"("fpHash");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_userId_idx" ON "DeviceFingerprint"("userId");

-- CreateIndex
CREATE INDEX "Photo_contentHash_idx" ON "Photo"("contentHash");

-- CreateIndex
CREATE INDEX "Photo_aHash_idx" ON "Photo"("aHash");
