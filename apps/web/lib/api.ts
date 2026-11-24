import {
  BridgeSuggestion,
  PersonSummary,
  ChangePasswordPayload,
  CreateHolidayPayload,
  PublicHoliday,
  TeamAbsence,
  NotificationItem,
  AdminListItem,
  CreateAdminPayload,
  CreateEmployeePayload,
  CreateSickLeavePayload,
  DashboardSummaryResponse,
  CreateVacationRequestPayload,
  EmployeeListItem,
  LoginResponse,
  ResetPasswordPayload,
  UpdateEmployeePayload,
  UpdateVacationStatusPayload,
  VacationCalendarDay,
  VacationRequest
} from '@vacation/shared';
import { redirect } from 'next/navigation';
import { API_URL } from './config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get userMessage(): string | null {
    try {
      const body: unknown = JSON.parse(this.message);
      if (typeof body !== 'object' || body === null || !('message' in body)) {
        return null;
      }
      const { message } = body;
      if (typeof message === 'string') {
        return message;
      }
      return Array.isArray(message) && typeof message[0] === 'string' ? message[0] : null;
    } catch {
      return null;
    }
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || 'Request failed');
  }

  return response.json() as Promise<T>;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    redirect('/login');
  }

  return parseResponse<T>(response);
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  });

  return parseResponse<LoginResponse>(response);
}

export async function fetchSummary(token: string) {
  const response = await fetch(`${API_URL}/vacations/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<DashboardSummaryResponse>(response);
}

export async function fetchVacations(token: string) {
  const response = await fetch(`${API_URL}/vacations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<VacationRequest[]>(response);
}

export async function createVacationRequest(
  token: string,
  payload: CreateVacationRequestPayload
) {
  const response = await fetch(`${API_URL}/vacations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<VacationRequest>(response);
}

export async function updateVacationStatus(
  token: string,
  requestId: string,
  action: 'approve' | 'reject',
  payload: UpdateVacationStatusPayload
) {
  const response = await fetch(`${API_URL}/vacations/${requestId}/${action}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<VacationRequest>(response);
}

export async function fetchEmployees(token: string) {
  const response = await fetch(`${API_URL}/admin/employees`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<EmployeeListItem[]>(response);
}

export async function createEmployee(token: string, payload: CreateEmployeePayload) {
  const response = await fetch(`${API_URL}/admin/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<EmployeeListItem>(response);
}

export async function fetchEmployeeById(token: string, id: string) {
  const response = await fetch(`${API_URL}/admin/employees/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<EmployeeListItem>(response);
}

export async function updateEmployee(token: string, id: string, payload: UpdateEmployeePayload) {
  const response = await fetch(`${API_URL}/admin/employees/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<EmployeeListItem>(response);
}

export async function resetEmployeePassword(
  token: string,
  id: string,
  payload: ResetPasswordPayload
) {
  const response = await fetch(`${API_URL}/admin/employees/${id}/reset-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<{ id: string; email: string }>(response);
}

export async function createAdmin(token: string, payload: CreateAdminPayload) {
  const response = await fetch(`${API_URL}/admin/admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<AdminListItem>(response);
}

export async function fetchAdmins(token: string) {
  const response = await fetch(`${API_URL}/admin/admins`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<AdminListItem[]>(response);
}

export async function createSickLeave(token: string, payload: CreateSickLeavePayload) {
  const response = await fetch(`${API_URL}/vacations/sick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<VacationRequest>(response);
}

export async function fetchVacationCalendar(token: string, year: number) {
  const response = await fetch(`${API_URL}/vacations/calendar?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<VacationCalendarDay[]>(response);
}

export async function fetchNotifications(token: string, unreadOnly = false) {
  const response = await fetch(`${API_URL}/notifications?unreadOnly=${unreadOnly}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<NotificationItem[]>(response);
}

export async function fetchUnreadNotificationCount(token: string) {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<{ unread: number }>(response);
}

export async function markNotificationRead(token: string, notificationId: string) {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  return parseJson<NotificationItem>(response);
}

export async function markAllNotificationsRead(token: string) {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  return parseJson<{ success: boolean }>(response);
}

export async function cancelVacationRequest(token: string, requestId: string) {
  const response = await fetch(`${API_URL}/vacations/${requestId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  return parseJson<VacationRequest>(response);
}

export async function fetchTeamAbsences(token: string, from: string, to: string) {
  const response = await fetch(`${API_URL}/vacations/team?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<TeamAbsence[]>(response);
}

export async function fetchHolidays(token: string, year: number) {
  const response = await fetch(`${API_URL}/holidays?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<PublicHoliday[]>(response);
}

export async function createHoliday(token: string, payload: CreateHolidayPayload) {
  const response = await fetch(`${API_URL}/holidays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<PublicHoliday>(response);
}

export async function deleteHoliday(token: string, holidayId: string) {
  const response = await fetch(`${API_URL}/holidays/${holidayId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  return parseJson<{ success: boolean }>(response);
}

export async function changePassword(token: string, payload: ChangePasswordPayload) {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseJson<{ success: boolean }>(response);
}

export async function fetchBridgeSuggestions(token: string) {
  const response = await fetch(`${API_URL}/vacations/suggestions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<BridgeSuggestion[]>(response);
}

export async function fetchTeamMembers(token: string) {
  const response = await fetch(`${API_URL}/vacations/team/members`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<PersonSummary[]>(response);
}
