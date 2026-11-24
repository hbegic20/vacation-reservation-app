-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COVER_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'LEAVE_REMINDER';

-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN     "coverUserId" TEXT,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "VacationRequest_coverUserId_idx" ON "VacationRequest"("coverUserId");

-- AddForeignKey
ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_coverUserId_fkey" FOREIGN KEY ("coverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
