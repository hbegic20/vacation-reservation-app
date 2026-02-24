export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AbsenceType = 'VACATION' | 'SICK';
export type NotificationType =
  | 'VACATION_REQUEST_SUBMITTED'
  | 'VACATION_APPROVED'
  | 'VACATION_REJECTED'
  | 'SICK_LEAVE_ADDED'
  | 'DAILY_DIGEST';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  department: string | null;
  isActive: boolean;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  absenceType: AbsenceType;
  status: VacationStatus;
  adminComment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    department: string | null;
  };
}

export interface CreateVacationRequestPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateVacationStatusPayload {
  adminComment?: string;
}

export interface EmployeeSummaryResponse {
  remainingVacationDays: number;
  upcomingVacations: VacationRequest[];
  requestHistory: VacationRequest[];
}

export interface AdminSummaryResponse {
  pendingApprovals: number;
  approvedRequests: number;
  employees: number;
}

export type DashboardSummaryResponse = EmployeeSummaryResponse | AdminSummaryResponse;

export interface EmployeeListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string | null;
  isActive: boolean;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
  createdAt: string;
  pendingRequests: number;
  upcomingApprovedRequests: number;
}

export interface CreateEmployeePayload {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  temporaryPassword: string;
  vacationDaysTotal: number;
}

export interface UpdateEmployeePayload {
  firstName: string;
  lastName: string;
  department?: string;
  vacationDaysTotal: number;
  isActive: boolean;
}

export interface ResetPasswordPayload {
  newPassword: string;
}

export interface CreateAdminPayload {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  password: string;
}

export interface AdminListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string | null;
  createdAt: string;
}

export interface CreateSickLeavePayload {
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  adminComment?: string;
}

export interface VacationCalendarRequestItem {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  absenceType: AbsenceType;
  status: VacationStatus;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    department: string | null;
  };
}

export interface VacationCalendarDay {
  date: string;
  requests: VacationCalendarRequestItem[];
}

export interface AdminNotificationItem {
  id: string;
  adminId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}
