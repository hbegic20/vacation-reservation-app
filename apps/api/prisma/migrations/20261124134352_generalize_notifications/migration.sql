-- Rename AdminNotification to Notification and keep existing rows
ALTER TABLE "AdminNotification" RENAME TO "Notification";
ALTER TABLE "Notification" RENAME COLUMN "adminId" TO "userId";
ALTER TABLE "Notification" RENAME CONSTRAINT "AdminNotification_pkey" TO "Notification_pkey";
ALTER TABLE "Notification" RENAME CONSTRAINT "AdminNotification_adminId_fkey" TO "Notification_userId_fkey";
ALTER INDEX "AdminNotification_adminId_isRead_idx" RENAME TO "Notification_userId_isRead_idx";
ALTER INDEX "AdminNotification_createdAt_idx" RENAME TO "Notification_createdAt_idx";
