'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createAdmin,
  createEmployee,
  createSickLeave,
  createVacationRequest,
  loginRequest,
  markAllNotificationsRead,
  markNotificationRead,
  resetEmployeePassword,
  updateEmployee,
  updateVacationStatus
} from '@/lib/api';

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
  } catch {
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
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  try {
    await createVacationRequest(token, {
      startDate: String(formData.get('startDate')),
      endDate: String(formData.get('endDate')),
      reason: String(formData.get('reason'))
    });

    revalidatePath('/vacations');
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch {
    return {
      success: false,
      error: 'Could not submit request. Check dates and remaining days.'
    };
  }
}

export async function moderateVacationAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const requestId = String(formData.get('requestId'));
  const action = String(formData.get('action')) as 'approve' | 'reject';
  const adminComment = String(formData.get('adminComment') || '');

  try {
    await updateVacationStatus(token, requestId, action, { adminComment });
    revalidatePath('/admin/requests');
    revalidatePath('/dashboard');
    revalidatePath('/vacations');
    return { success: true, error: null };
  } catch {
    return {
      success: false,
      error: 'Unable to update request status'
    };
  }
}

export async function createEmployeeAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

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
  } catch {
    return { success: false, error: 'Could not create employee. Check the form values.' };
  }
}

export async function updateEmployeeAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

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
  } catch {
    return { success: false, error: 'Unable to update employee.' };
  }
}

export async function resetEmployeePasswordAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const employeeId = String(formData.get('employeeId') || '');
  const newPassword = String(formData.get('newPassword') || '');

  try {
    await resetEmployeePassword(token, employeeId, { newPassword });
    revalidatePath(`/admin/employees/${employeeId}/edit`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: 'Unable to reset password.' };
  }
}

export async function createAdminAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

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
  } catch {
    return { success: false, error: 'Unable to create admin.' };
  }
}

export async function createSickLeaveAction(_: unknown, formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

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
  } catch {
    return { success: false, error: 'Unable to create sick leave entry.' };
  }
}

export async function markNotificationReadAction(formData: FormData) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const notificationId = String(formData.get('notificationId') || '');

  try {
    await markNotificationRead(token, notificationId);
    revalidatePath('/dashboard');
  } catch {
    return;
  }
}

export async function markAllNotificationsReadAction() {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  await markAllNotificationsRead(token);
  revalidatePath('/dashboard');
}
