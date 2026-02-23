/*
  Warnings:

  - You are about to drop the `PhoneVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "PhoneVerification_expiresAt_idx";

-- DropIndex
DROP INDEX "PhoneVerification_phone_idx";

-- DropIndex
DROP INDEX "PhoneVerification_phone_key";

-- DropIndex
DROP INDEX "ProfileView_viewedId_createdAt_idx";

-- DropIndex
DROP INDEX "ProfileView_viewerId_createdAt_idx";

-- DropIndex
DROP INDEX "SeenProfile_userId_dayKey_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhoneVerification";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Preferences" ("createdAt", "genders", "id", "intentFilter", "maxAge", "maxDistanceKm", "minAge", "religionFilter", "updatedAt", "userId", "valuesFilter") SELECT "createdAt", "genders", "id", "intentFilter", "maxAge", "maxDistanceKm", "minAge", "religionFilter", "updatedAt", "userId", "valuesFilter" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "lat" REAL,
    "lng" REAL,
    "placeId" TEXT,
    "gender" TEXT NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "birthdate" DATETIME NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" DATETIME,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "chatBannedUntil" DATETIME,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "lastLoginAt" DATETIME,
    "lastIp" TEXT,
    "lastUaHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("birthdate", "chatBannedUntil", "city", "createdAt", "email", "gender", "id", "isBlocked", "lastIp", "lastLoginAt", "lastUaHash", "lookingFor", "name", "passwordHash", "phone", "phoneVerifiedAt", "riskLevel", "riskScore", "role", "updatedAt", "verified") SELECT "birthdate", "chatBannedUntil", "city", "createdAt", "email", "gender", "id", "isBlocked", "lastIp", "lastLoginAt", "lastUaHash", "lookingFor", "name", "passwordHash", "phone", "phoneVerifiedAt", "riskLevel", "riskScore", "role", "updatedAt", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Like_fromUserId_idx" ON "Like"("fromUserId");
