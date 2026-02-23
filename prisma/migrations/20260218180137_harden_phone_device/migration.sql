/*
  Warnings:

  - You are about to drop the `PhoneOtp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `deviceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PhoneOtp_expiresAt_idx";

-- DropIndex
DROP INDEX "PhoneOtp_phone_purpose_createdAt_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhoneOtp";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIp" TEXT,
    "lastUa" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DeviceFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "gender" TEXT,
    "lookingFor" TEXT,
    "birthdate" DATETIME,
    "phone" TEXT,
    "phoneVerifiedAt" DATETIME,
    "verified" TEXT NOT NULL DEFAULT 'NONE',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("birthdate", "city", "createdAt", "email", "gender", "id", "isBlocked", "lookingFor", "name", "passwordHash", "phoneVerifiedAt", "role", "tier", "verified") SELECT "birthdate", "city", "createdAt", "email", "gender", "id", "isBlocked", "lookingFor", "name", "passwordHash", "phoneVerifiedAt", "role", "tier", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_city_idx" ON "User"("city");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_deviceId_key" ON "DeviceFingerprint"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_userId_idx" ON "DeviceFingerprint"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneVerification_phone_key" ON "PhoneVerification"("phone");
