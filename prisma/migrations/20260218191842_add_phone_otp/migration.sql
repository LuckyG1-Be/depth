/*
  Warnings:

  - You are about to drop the column `type` on the `AccountFlag` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AppConfig` table. All the data in the column will be lost.
  - You are about to drop the column `dateKey` on the `DailyQuota` table. All the data in the column will be lost.
  - You are about to drop the column `seenCount` on the `DailyQuota` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `lastIp` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `lastUa` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `loginCount` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `archivedAt` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `unlockProgressA` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `unlockProgressB` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `unlockReason` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `viewedAt` on the `ProfileView` table. All the data in the column will be lost.
  - You are about to drop the column `dateKey` on the `SeenProfile` table. All the data in the column will be lost.
  - You are about to drop the column `otherId` on the `SeenProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `verified` on the `User` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.
  - Added the required column `code` to the `AccountFlag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayKey` to the `DailyQuota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DailyQuota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fpHash` to the `DeviceFingerprint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromUserId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PhoneVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayKey` to the `SeenProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seenUserId` to the `SeenProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `birthdate` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lookingFor` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "fpHash" TEXT,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "deviceFp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AccountFlag" ("createdAt", "id", "reason", "userId") SELECT "createdAt", "id", "reason", "userId" FROM "AccountFlag";
DROP TABLE "AccountFlag";
ALTER TABLE "new_AccountFlag" RENAME TO "AccountFlag";
CREATE INDEX "AccountFlag_userId_createdAt_idx" ON "AccountFlag"("userId", "createdAt");
CREATE TABLE "new_AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppConfig" ("id", "key", "updatedAt", "value") SELECT "id", "key", "updatedAt", "value" FROM "AppConfig";
DROP TABLE "AppConfig";
ALTER TABLE "new_AppConfig" RENAME TO "AppConfig";
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");
CREATE TABLE "new_DailyQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "likesUsed" INTEGER NOT NULL DEFAULT 0,
    "seenUsed" INTEGER NOT NULL DEFAULT 0,
    "superlikeUsedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyQuota" ("id", "likesUsed", "userId") SELECT "id", "likesUsed", "userId" FROM "DailyQuota";
DROP TABLE "DailyQuota";
ALTER TABLE "new_DailyQuota" RENAME TO "DailyQuota";
CREATE UNIQUE INDEX "DailyQuota_userId_key" ON "DailyQuota"("userId");
CREATE TABLE "new_DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fpHash" TEXT NOT NULL,
    "uaHash" TEXT,
    "ipHash" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenCount" INTEGER NOT NULL DEFAULT 1,
    "platform" TEXT,
    "tz" TEXT,
    "lang" TEXT,
    CONSTRAINT "DeviceFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeviceFingerprint" ("firstSeenAt", "id", "lastSeenAt", "userId") SELECT "firstSeenAt", "id", "lastSeenAt", "userId" FROM "DeviceFingerprint";
DROP TABLE "DeviceFingerprint";
ALTER TABLE "new_DeviceFingerprint" RENAME TO "DeviceFingerprint";
CREATE INDEX "DeviceFingerprint_userId_lastSeenAt_idx" ON "DeviceFingerprint"("userId", "lastSeenAt");
CREATE UNIQUE INDEX "DeviceFingerprint_fpHash_userId_key" ON "DeviceFingerprint"("fpHash", "userId");
CREATE TABLE "new_Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Like_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Like" ("createdAt", "fromUserId", "id", "toUserId", "type") SELECT "createdAt", "fromUserId", "id", "toUserId", "type" FROM "Like";
DROP TABLE "Like";
ALTER TABLE "new_Like" RENAME TO "Like";
CREATE INDEX "Like_toUserId_idx" ON "Like"("toUserId");
CREATE UNIQUE INDEX "Like_fromUserId_toUserId_key" ON "Like"("fromUserId", "toUserId");
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" DATETIME,
    "superlikeFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "id", "isUnlocked", "superlikeFromId", "unlockedAt", "userAId", "userBId") SELECT "createdAt", "id", "isUnlocked", "superlikeFromId", "unlockedAt", "userAId", "userBId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_userAId_idx" ON "Match"("userAId");
CREATE INDEX "Match_userBId_idx" ON "Match"("userBId");
CREATE UNIQUE INDEX "Match_userAId_userBId_key" ON "Match"("userAId", "userBId");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("createdAt", "id", "matchId") SELECT "createdAt", "id", "matchId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");
CREATE INDEX "Message_fromUserId_idx" ON "Message"("fromUserId");
CREATE TABLE "new_PhoneVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PhoneVerification" ("attempts", "codeHash", "createdAt", "expiresAt", "id", "phone", "verifiedAt") SELECT "attempts", "codeHash", "createdAt", "expiresAt", "id", "phone", "verifiedAt" FROM "PhoneVerification";
DROP TABLE "PhoneVerification";
ALTER TABLE "new_PhoneVerification" RENAME TO "PhoneVerification";
CREATE UNIQUE INDEX "PhoneVerification_phone_key" ON "PhoneVerification"("phone");
CREATE INDEX "PhoneVerification_phone_idx" ON "PhoneVerification"("phone");
CREATE INDEX "PhoneVerification_expiresAt_idx" ON "PhoneVerification"("expiresAt");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("createdAt", "id", "userId") SELECT "createdAt", "id", "userId" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");
CREATE UNIQUE INDEX "Photo_userId_slot_key" ON "Photo"("userId", "slot");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "religion" TEXT,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "values" TEXT NOT NULL DEFAULT '[]',
    "passions" TEXT NOT NULL DEFAULT '[]',
    "q1" TEXT,
    "q2" TEXT,
    "q3" TEXT,
    "q4" TEXT,
    "q5" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("createdAt", "id", "intent", "maxAge", "minAge", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values") SELECT "createdAt", "id", "intent", "maxAge", "minAge", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE TABLE "new_ProfileView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "viewedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileView_viewedId_fkey" FOREIGN KEY ("viewedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProfileView" ("id", "viewedId", "viewerId") SELECT "id", "viewedId", "viewerId" FROM "ProfileView";
DROP TABLE "ProfileView";
ALTER TABLE "new_ProfileView" RENAME TO "ProfileView";
CREATE INDEX "ProfileView_viewerId_createdAt_idx" ON "ProfileView"("viewerId", "createdAt");
CREATE INDEX "ProfileView_viewedId_createdAt_idx" ON "ProfileView"("viewedId", "createdAt");
CREATE TABLE "new_SeenProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seenUserId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeenProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeenProfile" ("createdAt", "id", "userId") SELECT "createdAt", "id", "userId" FROM "SeenProfile";
DROP TABLE "SeenProfile";
ALTER TABLE "new_SeenProfile" RENAME TO "SeenProfile";
CREATE INDEX "SeenProfile_userId_dayKey_idx" ON "SeenProfile"("userId", "dayKey");
CREATE UNIQUE INDEX "SeenProfile_userId_seenUserId_dayKey_key" ON "SeenProfile"("userId", "seenUserId", "dayKey");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "birthdate" DATETIME NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" DATETIME,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "lastLoginAt" DATETIME,
    "lastIp" TEXT,
    "lastUaHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);
INSERT INTO "new_User" ("birthdate", "city", "createdAt", "email", "gender", "id", "isBlocked", "lookingFor", "name", "passwordHash", "phone", "phoneVerifiedAt", "role", "verified") SELECT "birthdate", "city", "createdAt", "email", "gender", "id", "isBlocked", "lookingFor", "name", "passwordHash", "phone", "phoneVerifiedAt", "role", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_idx" ON "PhoneOtp"("phone");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneOtp_phone_key" ON "PhoneOtp"("phone");
