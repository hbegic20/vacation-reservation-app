import {
  AdminNotificationItem,
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

export async function fetchApprovedVacations(token: string) {
  const response = await fetch(`${API_URL}/vacations/approved`, {
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

export async function fetchAdminNotifications(token: string, unreadOnly = false) {
  const response = await fetch(`${API_URL}/notifications/admin?unreadOnly=${unreadOnly}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  return parseJson<AdminNotificationItem[]>(response);
}

export async function fetchAdminUnreadNotificationCount(token: string) {
  const response = await fetch(`${API_URL}/notifications/admin/unread-count`, {
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

  return parseJson<AdminNotificationItem>(response);
}

export async function markAllNotificationsRead(token: string) {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });

  return parseJson<{ success: boolean }>(response);
}
