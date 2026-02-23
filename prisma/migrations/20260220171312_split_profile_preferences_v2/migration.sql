/*
  Warnings:

  - You are about to drop the column `maxAge` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `minAge` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `toUserId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 20,
    "maxAge" INTEGER NOT NULL DEFAULT 35,
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 50,
    "genders" TEXT NOT NULL DEFAULT '[]',
    "intentFilter" TEXT,
    "religionFilter" TEXT,
    "valuesFilter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("createdAt", "fromUserId", "id", "matchId", "text") SELECT "createdAt", "fromUserId", "id", "matchId", "text" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");
CREATE INDEX "Message_fromUserId_idx" ON "Message"("fromUserId");
CREATE INDEX "Message_toUserId_isRead_idx" ON "Message"("toUserId", "isRead");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "religion" TEXT,
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
INSERT INTO "new_Profile" ("createdAt", "id", "intent", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values") SELECT "createdAt", "id", "intent", "passions", "q1", "q2", "q3", "q4", "q5", "religion", "updatedAt", "userId", "values" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");

-- CreateIndex
CREATE INDEX "Preferences_userId_idx" ON "Preferences"("userId");
