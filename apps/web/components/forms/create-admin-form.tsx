'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createAdminAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Admin'}
    </Button>
  );
}

export function CreateAdminForm() {
  const [state, formAction] = useFormState(createAdminAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="admin-first-name" className="text-sm font-medium">First Name</label>
          <Input id="admin-first-name" name="firstName" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="admin-last-name" className="text-sm font-medium">Last Name</label>
          <Input id="admin-last-name" name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-email" className="text-sm font-medium">Email</label>
        <Input id="admin-email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-department" className="text-sm font-medium">Department</label>
        <Input id="admin-department" name="department" placeholder="Operations" />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-medium">Password</label>
        <Input id="admin-password" name="password" type="password" minLength={8} required />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Admin account created.</p> : null}
      <SubmitButton />
    </form>
  );
}
