-- Add a reversible user-controlled visibility pause.
ALTER TABLE "User" ADD COLUMN "isPaused" BOOLEAN NOT NULL DEFAULT false;
