import {
  AuthUser,
  DocumentItem,
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

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: FormData | object;
}

type Success = { success: boolean };

function apiPath(strings: TemplateStringsArray, ...values: Array<string | number | boolean>): string {
  return strings.reduce(
    (path, part, index) =>
      path + part + (index < values.length ? encodeURIComponent(String(values[index])) : ''),
    ''
  );
}

function encodeBody(body: RequestOptions['body']): Pick<RequestInit, 'body'> & { headers: HeadersInit } {
  if (body === undefined || body instanceof FormData) {
    return { body, headers: {} };
  }
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

function send(token: string, path: string, { method = 'GET', body }: RequestOptions = {}) {
  const encoded = encodeBody(body);
  return fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...encoded.headers },
    body: encoded.body,
    cache: 'no-store'
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || 'Request failed');
  }

  return response.json() as Promise<T>;
}

async function apiRequest<T>(token: string, path: string, options?: RequestOptions): Promise<T> {
  const response = await send(token, path, options);
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

export async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  const response = await send(token, '/me');
  return response.ok ? (response.json() as Promise<AuthUser>) : null;
}

export function fetchSummary(token: string) {
  return apiRequest<DashboardSummaryResponse>(token, '/vacations/summary');
}

export function fetchVacations(token: string) {
  return apiRequest<VacationRequest[]>(token, '/vacations');
}

export function createVacationRequest(token: string, payload: CreateVacationRequestPayload) {
  return apiRequest<VacationRequest>(token, '/vacations', { method: 'POST', body: payload });
}

export function updateVacationStatus(
  token: string,
  requestId: string,
  action: 'approve' | 'reject',
  payload: UpdateVacationStatusPayload
) {
  return apiRequest<VacationRequest>(token, apiPath`/vacations/${requestId}/${action}`, {
    method: 'PATCH',
    body: payload
  });
}

export function fetchEmployees(token: string) {
  return apiRequest<EmployeeListItem[]>(token, '/admin/employees');
}

export function createEmployee(token: string, payload: CreateEmployeePayload) {
  return apiRequest<EmployeeListItem>(token, '/admin/employees', { method: 'POST', body: payload });
}

export function fetchEmployeeById(token: string, id: string) {
  return apiRequest<EmployeeListItem>(token, apiPath`/admin/employees/${id}`);
}

export function updateEmployee(token: string, id: string, payload: UpdateEmployeePayload) {
  return apiRequest<EmployeeListItem>(token, apiPath`/admin/employees/${id}`, {
    method: 'PATCH',
    body: payload
  });
}

export function resetEmployeePassword(token: string, id: string, payload: ResetPasswordPayload) {
  return apiRequest<{ id: string; email: string }>(token, apiPath`/admin/employees/${id}/reset-password`, {
    method: 'PATCH',
    body: payload
  });
}

export function createAdmin(token: string, payload: CreateAdminPayload) {
  return apiRequest<AdminListItem>(token, '/admin/admins', { method: 'POST', body: payload });
}

export function fetchAdmins(token: string) {
  return apiRequest<AdminListItem[]>(token, '/admin/admins');
}

export function createSickLeave(token: string, payload: CreateSickLeavePayload) {
  return apiRequest<VacationRequest>(token, '/vacations/sick', { method: 'POST', body: payload });
}

export function fetchVacationCalendar(token: string, year: number) {
  return apiRequest<VacationCalendarDay[]>(token, apiPath`/vacations/calendar?year=${year}`);
}

export function fetchNotifications(token: string, unreadOnly = false) {
  return apiRequest<NotificationItem[]>(token, apiPath`/notifications?unreadOnly=${unreadOnly}`);
}

export function fetchUnreadNotificationCount(token: string) {
  return apiRequest<{ unread: number }>(token, '/notifications/unread-count');
}

export function markNotificationRead(token: string, notificationId: string) {
  return apiRequest<NotificationItem>(token, apiPath`/notifications/${notificationId}/read`, {
    method: 'PATCH'
  });
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<Success>(token, '/notifications/read-all', { method: 'PATCH' });
}

export function cancelVacationRequest(token: string, requestId: string) {
  return apiRequest<VacationRequest>(token, apiPath`/vacations/${requestId}/cancel`, { method: 'PATCH' });
}

export function fetchTeamAbsences(token: string, from: string, to: string) {
  return apiRequest<TeamAbsence[]>(token, apiPath`/vacations/team?from=${from}&to=${to}`);
}

export function fetchHolidays(token: string, year: number) {
  return apiRequest<PublicHoliday[]>(token, apiPath`/holidays?year=${year}`);
}

export function createHoliday(token: string, payload: CreateHolidayPayload) {
  return apiRequest<PublicHoliday>(token, '/holidays', { method: 'POST', body: payload });
}

export function deleteHoliday(token: string, holidayId: string) {
  return apiRequest<Success>(token, apiPath`/holidays/${holidayId}`, { method: 'DELETE' });
}

export function changePassword(token: string, payload: ChangePasswordPayload) {
  return apiRequest<Success>(token, '/auth/change-password', { method: 'POST', body: payload });
}

export function fetchBridgeSuggestions(token: string) {
  return apiRequest<BridgeSuggestion[]>(token, '/vacations/suggestions');
}

export function fetchTeamMembers(token: string) {
  return apiRequest<PersonSummary[]>(token, '/vacations/team/members');
}

export function fetchDocuments(token: string) {
  return apiRequest<DocumentItem[]>(token, '/documents');
}

export function uploadDocument(token: string, upload: { title: string; description: string; file: File }) {
  const body = new FormData();
  body.set('title', upload.title);
  if (upload.description) {
    body.set('description', upload.description);
  }
  body.set('file', upload.file, upload.file.name);

  return apiRequest<DocumentItem>(token, '/documents', { method: 'POST', body });
}

export function updateDocument(token: string, documentId: string, changes: { isPublished: boolean }) {
  return apiRequest<DocumentItem>(token, apiPath`/documents/${documentId}`, {
    method: 'PATCH',
    body: changes
  });
}

export function deleteDocument(token: string, documentId: string) {
  return apiRequest<Success>(token, apiPath`/documents/${documentId}`, { method: 'DELETE' });
}

export function fetchDocumentFile(token: string, documentId: string, download: boolean) {
  const query = download ? '?download=1' : '';
  return send(token, `${apiPath`/documents/${documentId}/file`}${query}`);
}
