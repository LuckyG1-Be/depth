/*
  Warnings:

  - You are about to drop the column `type` on the `AccountFlag` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `Report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,seenUserId,dayKey]` on the table `SeenProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `AccountFlag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reasonCode` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SeenProfile_userId_seenUserId_key";

-- AlterTable
ALTER TABLE "Block" ADD COLUMN "reason" TEXT;

-- CreateTable
CREATE TABLE "EmailOtp" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "phone" TEXT NOT NULL PRIMARY KEY,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reason" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AccountFlag" ("createdAt", "id", "severity", "userId") SELECT "createdAt", "id", "severity", "userId" FROM "AccountFlag";
DROP TABLE "AccountFlag";
ALTER TABLE "new_AccountFlag" RENAME TO "AccountFlag";
CREATE INDEX "AccountFlag_userId_idx" ON "AccountFlag"("userId");
CREATE INDEX "AccountFlag_code_idx" ON "AccountFlag"("code");
CREATE INDEX "AccountFlag_createdAt_idx" ON "AccountFlag"("createdAt");
CREATE TABLE "new_DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fpHash" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeviceFingerprint" ("createdAt", "fpHash", "id", "lastSeenAt", "userId") SELECT "createdAt", "fpHash", "id", "lastSeenAt", "userId" FROM "DeviceFingerprint";
DROP TABLE "DeviceFingerprint";
ALTER TABLE "new_DeviceFingerprint" RENAME TO "DeviceFingerprint";
CREATE INDEX "DeviceFingerprint_userId_idx" ON "DeviceFingerprint"("userId");
CREATE INDEX "DeviceFingerprint_fpHash_idx" ON "DeviceFingerprint"("fpHash");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "matchId" TEXT,
    "reasonCode" TEXT NOT NULL,
    "details" TEXT,
    "includeLastMessages" BOOLEAN NOT NULL DEFAULT false,
    "blockImmediately" BOOLEAN NOT NULL DEFAULT false,
    "evidence" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "details", "id", "reportedId", "reporterId") SELECT "createdAt", "details", "id", "reportedId", "reporterId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");
CREATE INDEX "Report_matchId_idx" ON "Report"("matchId");
CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EmailOtp_expiresAt_idx" ON "EmailOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "Block_createdAt_idx" ON "Block"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeenProfile_userId_seenUserId_dayKey_key" ON "SeenProfile"("userId", "seenUserId", "dayKey");
