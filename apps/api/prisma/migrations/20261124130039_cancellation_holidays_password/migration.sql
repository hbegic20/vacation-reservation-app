-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'VACATION_CANCELLED';

-- AlterEnum
ALTER TYPE "VacationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN     "workingDays" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_date_key" ON "PublicHoliday"("date");

-- Backfill working days for existing requests (Monday to Friday, inclusive)
UPDATE "VacationRequest"
SET "workingDays" = (
    SELECT COUNT(*)
    FROM generate_series("startDate"::date, "endDate"::date, interval '1 day') AS day
    WHERE EXTRACT(ISODOW FROM day) < 6
);
