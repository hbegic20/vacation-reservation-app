import { AbsenceType, NotificationType, VacationStatus } from '@vacation/shared';

export const statusLabels: Record<VacationStatus, string> = {
  PENDING: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

export const absenceTypeLabels: Record<AbsenceType, string> = {
  VACATION: 'Vacation',
  SICK: 'Sick leave'
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  VACATION_REQUEST_SUBMITTED: 'New request',
  VACATION_APPROVED: 'Approved',
  VACATION_REJECTED: 'Rejected',
  VACATION_CANCELLED: 'Cancelled',
  SICK_LEAVE_ADDED: 'Sick leave',
  DAILY_DIGEST: 'Daily digest'
};
