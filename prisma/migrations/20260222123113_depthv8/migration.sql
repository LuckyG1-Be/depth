/*
  Warnings:

  - You are about to drop the column `code` on the `AccountFlag` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `AccountFlag` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,seenUserId]` on the table `SeenProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `AccountFlag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Message_fromUserId_idx";

-- DropIndex
DROP INDEX "SeenProfile_userId_seenUserId_dayKey_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AccountFlag" ("createdAt", "id", "userId") SELECT "createdAt", "id", "userId" FROM "AccountFlag";
DROP TABLE "AccountFlag";
ALTER TABLE "new_AccountFlag" RENAME TO "AccountFlag";
CREATE INDEX "AccountFlag_userId_idx" ON "AccountFlag"("userId");
CREATE INDEX "AccountFlag_type_idx" ON "AccountFlag"("type");
CREATE TABLE "new_DailyQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "likesUsed" INTEGER NOT NULL DEFAULT 0,
    "seenUsed" INTEGER NOT NULL DEFAULT 0,
    "superlikeUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyQuota" ("dayKey", "id", "likesUsed", "seenUsed", "superlikeUsedAt", "updatedAt", "userId") SELECT "dayKey", "id", "likesUsed", "seenUsed", "superlikeUsedAt", "updatedAt", "userId" FROM "DailyQuota";
DROP TABLE "DailyQuota";
ALTER TABLE "new_DailyQuota" RENAME TO "DailyQuota";
CREATE UNIQUE INDEX "DailyQuota_userId_key" ON "DailyQuota"("userId");
CREATE TABLE "new_Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 18,
    "maxAge" INTEGER NOT NULL DEFAULT 99,
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 50,
    "genders" TEXT NOT NULL DEFAULT '[]',
    "intentFilter" TEXT,
    "religionFilter" TEXT,
    "valuesFilter" TEXT,
    "verifiedOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Preferences" ("createdAt", "genders", "id", "intentFilter", "maxAge", "maxDistanceKm", "minAge", "religionFilter", "updatedAt", "userId", "valuesFilter") SELECT "createdAt", "genders", "id", "intentFilter", "maxAge", "maxDistanceKm", "minAge", "religionFilter", "updatedAt", "userId", "valuesFilter" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "details", "id", "reason", "reportedId", "reporterId") SELECT "createdAt", "details", "id", "reason", "reportedId", "reporterId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
CREATE TABLE "new_SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "uaHash" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SecurityEvent" ("createdAt", "id", "meta", "scoreDelta", "severity", "type", "userId") SELECT "createdAt", "id", "meta", "scoreDelta", "severity", "type", "userId" FROM "SecurityEvent";
DROP TABLE "SecurityEvent";
ALTER TABLE "new_SecurityEvent" RENAME TO "SecurityEvent";
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_idx" ON "ProfileView"("viewerId");

-- CreateIndex
CREATE INDEX "ProfileView_viewedId_idx" ON "ProfileView"("viewedId");

-- CreateIndex
CREATE INDEX "ProfileView_createdAt_idx" ON "ProfileView"("createdAt");

-- CreateIndex
CREATE INDEX "SeenProfile_userId_dayKey_idx" ON "SeenProfile"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "SeenProfile_seenUserId_idx" ON "SeenProfile"("seenUserId");

-- CreateIndex
CREATE INDEX "SeenProfile_createdAt_idx" ON "SeenProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeenProfile_userId_seenUserId_key" ON "SeenProfile"("userId", "seenUserId");
