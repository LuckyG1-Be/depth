-- CreateTable
CREATE TABLE "DailyLikeQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyLikeQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DailyLikeQuota_userId_dateKey_idx" ON "DailyLikeQuota"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLikeQuota_userId_dateKey_key" ON "DailyLikeQuota"("userId", "dateKey");
