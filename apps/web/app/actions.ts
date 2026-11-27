'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireToken } from '@/lib/auth';
import {
  ApiError,
  cancelVacationRequest,
  changePassword,
  createAdmin,
  createHoliday,
  deleteDocument,
  deleteHoliday,
  createEmployee,
  createSickLeave,
  createVacationRequest,
  loginRequest,
  markAllNotificationsRead,
  markNotificationRead,
  resetEmployeePassword,
  updateDocument,
  updateEmployee,
  uploadDocument,
  updateVacationStatus
} from '@/lib/api';

function failureState(error: unknown, message: string) {
  if (!(error instanceof ApiError)) {
    throw error;
  }

  return { success: false, error: message };
}

function failureWithApiMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    throw error;
  }

  const isClientError = error.status >= 400 && error.status < 500;
  return { success: false, error: (isClientError ? error.userMessage : null) ?? fallback };
}

function succeeded() {
  return { success: true, error: null };
}

function readText(formData: FormData, name: string): string {
  return String(formData.get(name) || '');
}

function readNumber(formData: FormData, name: string): number {
  return Number(formData.get(name) || 0);
}

function parseModerationAction(value: FormDataEntryValue | null): 'approve' | 'reject' | null {
  return value === 'approve' || value === 'reject' ? value : null;
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = readText(formData, 'email');
  const password = readText(formData, 'password');

  try {
    const result = await loginRequest(email, password);

    cookies().set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }

    return {
      error: 'Invalid credentials'
    };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete('access_token');
  redirect('/login');
}

export async function createVacationAction(_: unknown, formData: FormData) {
  const token = requireToken();

  try {
    const coverUserId = readText(formData, 'coverUserId');
    await createVacationRequest(token, {
      startDate: readText(formData, 'startDate'),
      endDate: readText(formData, 'endDate'),
      reason: readText(formData, 'reason'),
      coverUserId: coverUserId || undefined
    });

    revalidatePath('/vacations');
    revalidatePath('/dashboard');
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Could not submit request. Check dates and remaining days.');
  }
}

export async function moderateVacationAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const requestId = readText(formData, 'requestId');
  const action = parseModerationAction(formData.get('action'));
  const adminComment = readText(formData, 'adminComment');

  if (!action) {
    return { success: false, error: 'Choose approve or reject.' };
  }

  try {
    await updateVacationStatus(token, requestId, action, { adminComment });
    revalidatePath('/admin/requests');
    revalidatePath('/dashboard');
    revalidatePath('/vacations');
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to update request status');
  }
}

export async function createEmployeeAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const email = readText(formData, 'email');
  const firstName = readText(formData, 'firstName');
  const lastName = readText(formData, 'lastName');
  const department = readText(formData, 'department');
  const temporaryPassword = readText(formData, 'temporaryPassword');
  const vacationDaysTotal = readNumber(formData, 'vacationDaysTotal');

  try {
    await createEmployee(token, {
      email,
      firstName,
      lastName,
      department: department || undefined,
      temporaryPassword,
      vacationDaysTotal
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin/employees/new');
    return succeeded();
  } catch (error) {
    return failureState(error, 'Could not create employee. Check the form values.');
  }
}

export async function updateEmployeeAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const employeeId = readText(formData, 'employeeId');
  const firstName = readText(formData, 'firstName');
  const lastName = readText(formData, 'lastName');
  const department = readText(formData, 'department');
  const vacationDaysTotal = readNumber(formData, 'vacationDaysTotal');
  const isActive = formData.get('isActive') === 'on';

  try {
    await updateEmployee(token, employeeId, {
      firstName,
      lastName,
      department: department || undefined,
      vacationDaysTotal,
      isActive
    });
    revalidatePath(`/admin/employees/${employeeId}/edit`);
    revalidatePath('/admin/employees');
    return succeeded();
  } catch (error) {
    return failureState(error, 'Unable to update employee.');
  }
}

export async function resetEmployeePasswordAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const employeeId = readText(formData, 'employeeId');
  const newPassword = readText(formData, 'newPassword');

  try {
    await resetEmployeePassword(token, employeeId, { newPassword });
    revalidatePath(`/admin/employees/${employeeId}/edit`);
    return succeeded();
  } catch (error) {
    return failureState(error, 'Unable to reset password.');
  }
}

export async function createAdminAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const email = readText(formData, 'email');
  const firstName = readText(formData, 'firstName');
  const lastName = readText(formData, 'lastName');
  const department = readText(formData, 'department');
  const password = readText(formData, 'password');

  try {
    await createAdmin(token, {
      email,
      firstName,
      lastName,
      department: department || undefined,
      password
    });
    revalidatePath('/admin/admins');
    return succeeded();
  } catch (error) {
    return failureState(error, 'Unable to create admin.');
  }
}

export async function createSickLeaveAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const userId = readText(formData, 'userId');
  const startDate = readText(formData, 'startDate');
  const endDate = readText(formData, 'endDate');
  const reason = readText(formData, 'reason');
  const adminComment = readText(formData, 'adminComment');

  try {
    await createSickLeave(token, {
      userId,
      startDate,
      endDate,
      reason,
      adminComment: adminComment || undefined
    });
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/requests');
    revalidatePath('/vacations');
    return succeeded();
  } catch (error) {
    return failureState(error, 'Unable to create sick leave entry.');
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const token = requireToken();
  const notificationId = readText(formData, 'notificationId');

  try {
    await markNotificationRead(token, notificationId);
  } catch (error) {
    const isAlreadyGone = error instanceof ApiError && error.status === 404;
    if (!isAlreadyGone) {
      throw error;
    }
  }
  revalidatePath('/', 'layout');
}

export async function markAllNotificationsReadAction() {
  const token = requireToken();

  await markAllNotificationsRead(token);
  revalidatePath('/', 'layout');
}

export async function cancelVacationAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const requestId = readText(formData, 'requestId');

  try {
    await cancelVacationRequest(token, requestId);
    revalidatePath('/vacations');
    revalidatePath('/dashboard');
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to cancel this request.');
  }
}

export async function createHolidayAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const date = readText(formData, 'date');
  const name = readText(formData, 'name');

  try {
    await createHoliday(token, { date, name });
    revalidatePath('/admin/holidays');
    revalidatePath('/admin/calendar');
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to add this holiday.');
  }
}

export async function deleteHolidayAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const holidayId = readText(formData, 'holidayId');

  try {
    await deleteHoliday(token, holidayId);
    revalidatePath('/admin/holidays');
    revalidatePath('/admin/calendar');
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to remove this holiday.');
  }
}

export async function changePasswordAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const currentPassword = readText(formData, 'currentPassword');
  const newPassword = readText(formData, 'newPassword');
  const confirmPassword = readText(formData, 'confirmPassword');

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'The new passwords don’t match.' };
  }

  try {
    await changePassword(token, { currentPassword, newPassword });
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to change your password.');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

const maxDocumentBytes = 10 * 1024 * 1024;

function revalidateDocuments() {
  revalidatePath('/admin/documents');
  revalidatePath('/documents');
}

export async function uploadDocumentAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const title = readText(formData, 'title').trim();
  const description = readText(formData, 'description').trim();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Choose a file to upload.' };
  }
  if (file.size > maxDocumentBytes) {
    return { success: false, error: 'Files can be at most 10 MB.' };
  }

  try {
    await uploadDocument(token, { title, description, file });
    revalidateDocuments();
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to upload this document.');
  }
}

export async function setDocumentPublishedAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const documentId = readText(formData, 'documentId');
  const isPublished = formData.get('isPublished') === 'true';

  try {
    await updateDocument(token, documentId, { isPublished });
    revalidateDocuments();
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to update this document.');
  }
}

export async function deleteDocumentAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const documentId = readText(formData, 'documentId');

  try {
    await deleteDocument(token, documentId);
    revalidateDocuments();
    return succeeded();
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to delete this document.');
  }
}
