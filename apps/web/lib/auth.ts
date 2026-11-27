import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { fetchCurrentUser } from './api';
import { AuthUser } from '@vacation/shared';

const getToken = cache(() => cookies().get('access_token')?.value ?? null);

export function requireToken(): string {
  const token = getToken();
  if (!token) {
    redirect('/login');
  }

  return token;
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = getToken();
  if (!token) {
    return null;
  }

  return fetchCurrentUser(token);
});

export const changePasswordPath = '/account/password';

export async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireUser() {
  const user = await requireSignedIn();
  if (user.mustChangePassword) {
    redirect(changePasswordPath);
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return user;
}
