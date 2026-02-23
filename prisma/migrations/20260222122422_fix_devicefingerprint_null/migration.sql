-- Fix orphan DeviceFingerprint rows BEFORE making userId required

DELETE FROM "DeviceFingerprint"
WHERE "userId" IS NULL;

-- Redefine table with userId NOT NULL
CREATE TABLE "new_DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fpHash" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceFingerprint_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ✅ IMPORTANT: do NOT use SELECT * (old table may have extra columns)
INSERT INTO "new_DeviceFingerprint" ("id","userId","fpHash","lastSeenAt","createdAt")
SELECT "id","userId","fpHash","lastSeenAt","createdAt"
FROM "DeviceFingerprint";

DROP TABLE "DeviceFingerprint";

ALTER TABLE "new_DeviceFingerprint"
RENAME TO "DeviceFingerprint";

CREATE INDEX "DeviceFingerprint_userId_idx"
ON "DeviceFingerprint"("userId");

CREATE INDEX "DeviceFingerprint_fpHash_idx"
ON "DeviceFingerprint"("fpHash");