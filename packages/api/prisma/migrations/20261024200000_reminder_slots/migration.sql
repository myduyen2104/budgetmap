ALTER TABLE "User" ADD COLUMN "dailyReminderTimes" TEXT[] NOT NULL DEFAULT ARRAY['19:00']::TEXT[];

UPDATE "User"
SET "dailyReminderTimes" = ARRAY["dailyReminderTime"];
