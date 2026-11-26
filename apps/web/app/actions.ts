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

function parseModerationAction(value: FormDataEntryValue | null): 'approve' | 'reject' | null {
  return value === 'approve' || value === 'reject' ? value : null;
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

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
    const coverUserId = String(formData.get('coverUserId') || '');
    await createVacationRequest(token, {
      startDate: String(formData.get('startDate')),
      endDate: String(formData.get('endDate')),
      reason: String(formData.get('reason')),
      coverUserId: coverUserId || undefined
    });

    revalidatePath('/vacations');
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Could not submit request. Check dates and remaining days.');
  }
}

export async function moderateVacationAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const requestId = String(formData.get('requestId'));
  const action = parseModerationAction(formData.get('action'));
  const adminComment = String(formData.get('adminComment') || '');

  if (!action) {
    return { success: false, error: 'Choose approve or reject.' };
  }

  try {
    await updateVacationStatus(token, requestId, action, { adminComment });
    revalidatePath('/admin/requests');
    revalidatePath('/dashboard');
    revalidatePath('/vacations');
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to update request status');
  }
}

export async function createEmployeeAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const email = String(formData.get('email') || '');
  const firstName = String(formData.get('firstName') || '');
  const lastName = String(formData.get('lastName') || '');
  const department = String(formData.get('department') || '');
  const temporaryPassword = String(formData.get('temporaryPassword') || '');
  const vacationDaysTotal = Number(formData.get('vacationDaysTotal') || 0);

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
    return { success: true, error: null };
  } catch (error) {
    return failureState(error, 'Could not create employee. Check the form values.');
  }
}

export async function updateEmployeeAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const employeeId = String(formData.get('employeeId') || '');
  const firstName = String(formData.get('firstName') || '');
  const lastName = String(formData.get('lastName') || '');
  const department = String(formData.get('department') || '');
  const vacationDaysTotal = Number(formData.get('vacationDaysTotal') || 0);
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
    return { success: true, error: null };
  } catch (error) {
    return failureState(error, 'Unable to update employee.');
  }
}

export async function resetEmployeePasswordAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const employeeId = String(formData.get('employeeId') || '');
  const newPassword = String(formData.get('newPassword') || '');

  try {
    await resetEmployeePassword(token, employeeId, { newPassword });
    revalidatePath(`/admin/employees/${employeeId}/edit`);
    return { success: true, error: null };
  } catch (error) {
    return failureState(error, 'Unable to reset password.');
  }
}

export async function createAdminAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const email = String(formData.get('email') || '');
  const firstName = String(formData.get('firstName') || '');
  const lastName = String(formData.get('lastName') || '');
  const department = String(formData.get('department') || '');
  const password = String(formData.get('password') || '');

  try {
    await createAdmin(token, {
      email,
      firstName,
      lastName,
      department: department || undefined,
      password
    });
    revalidatePath('/admin/admins');
    return { success: true, error: null };
  } catch (error) {
    return failureState(error, 'Unable to create admin.');
  }
}

export async function createSickLeaveAction(_: unknown, formData: FormData) {
  const token = requireToken();

  const userId = String(formData.get('userId') || '');
  const startDate = String(formData.get('startDate') || '');
  const endDate = String(formData.get('endDate') || '');
  const reason = String(formData.get('reason') || '');
  const adminComment = String(formData.get('adminComment') || '');

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
    return { success: true, error: null };
  } catch (error) {
    return failureState(error, 'Unable to create sick leave entry.');
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const token = requireToken();
  const notificationId = String(formData.get('notificationId') || '');

  try {
    await markNotificationRead(token, notificationId);
  } catch (error) {
    if (!(error instanceof ApiError)) {
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
  const requestId = String(formData.get('requestId') || '');

  try {
    await cancelVacationRequest(token, requestId);
    revalidatePath('/vacations');
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to cancel this request.');
  }
}

export async function createHolidayAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const date = String(formData.get('date') || '');
  const name = String(formData.get('name') || '');

  try {
    await createHoliday(token, { date, name });
    revalidatePath('/admin/holidays');
    revalidatePath('/admin/calendar');
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to add this holiday.');
  }
}

export async function deleteHolidayAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const holidayId = String(formData.get('holidayId') || '');

  try {
    await deleteHoliday(token, holidayId);
    revalidatePath('/admin/holidays');
    revalidatePath('/admin/calendar');
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to remove this holiday.');
  }
}

export async function changePasswordAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const currentPassword = String(formData.get('currentPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

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
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
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
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to upload this document.');
  }
}

export async function setDocumentPublishedAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const documentId = String(formData.get('documentId') || '');
  const isPublished = formData.get('isPublished') === 'true';

  try {
    await updateDocument(token, documentId, { isPublished });
    revalidateDocuments();
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to update this document.');
  }
}

export async function deleteDocumentAction(_: unknown, formData: FormData) {
  const token = requireToken();
  const documentId = String(formData.get('documentId') || '');

  try {
    await deleteDocument(token, documentId);
    revalidateDocuments();
    return { success: true, error: null };
  } catch (error) {
    return failureWithApiMessage(error, 'Unable to delete this document.');
  }
}
