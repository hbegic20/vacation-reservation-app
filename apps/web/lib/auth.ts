import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { API_URL } from './config';
import { AuthUser } from '@vacation/shared';

export const getToken = cache(() => cookies().get('access_token')?.value ?? null);

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

  const response = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
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
