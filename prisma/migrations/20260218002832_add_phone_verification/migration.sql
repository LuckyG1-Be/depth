/*
  Warnings:

  - You are about to drop the `DailyLikeQuota` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DailyLikeQuota_userId_dateKey_key";

-- DropIndex
DROP INDEX "DailyLikeQuota_userId_dateKey_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "birthdate" DATETIME;
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "lookingFor" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DailyLikeQuota";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "seenCount" INTEGER NOT NULL DEFAULT 0,
    "likesUsed" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyQuota" ("dateKey", "id", "seenCount", "userId") SELECT "dateKey", "id", "seenCount", "userId" FROM "DailyQuota";
DROP TABLE "DailyQuota";
ALTER TABLE "new_DailyQuota" RENAME TO "DailyQuota";
CREATE UNIQUE INDEX "DailyQuota_userId_dateKey_key" ON "DailyQuota"("userId", "dateKey");
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" DATETIME,
    "unlockProgressA" INTEGER NOT NULL DEFAULT 0,
    "unlockProgressB" INTEGER NOT NULL DEFAULT 0,
    "unlockReason" TEXT,
    "superlikeFromId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "id", "isUnlocked", "superlikeFromId", "unlockProgressA", "unlockProgressB", "unlockReason", "unlockedAt", "userAId", "userBId") SELECT "createdAt", "id", "isUnlocked", "superlikeFromId", "unlockProgressA", "unlockProgressB", "unlockReason", "unlockedAt", "userAId", "userBId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_userAId_idx" ON "Match"("userAId");
CREATE INDEX "Match_userBId_idx" ON "Match"("userBId");
CREATE INDEX "Match_isArchived_archivedAt_idx" ON "Match"("isArchived", "archivedAt");
CREATE UNIQUE INDEX "Match_userAId_userBId_key" ON "Match"("userAId", "userBId");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "passions" TEXT NOT NULL,
    "intent" TEXT NOT NULL DEFAULT 'Open',
    "religion" TEXT NOT NULL DEFAULT 'Geen',
    "minAge" INTEGER NOT NULL DEFAULT 18,
    "maxAge" INTEGER NOT NULL DEFAULT 99,
    "q1" TEXT NOT NULL,
    "q2" TEXT NOT NULL,
    "q3" TEXT NOT NULL,
    "q4" TEXT NOT NULL,
    "q5" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("createdAt", "id", "intent", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values") SELECT "createdAt", "id", "intent", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_purpose_createdAt_idx" ON "PhoneOtp"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
