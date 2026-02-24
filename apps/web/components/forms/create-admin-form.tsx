'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createAdminAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">First Name</label>
          <Input name="firstName" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Last Name</label>
          <Input name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Department</label>
        <Input name="department" placeholder="Operations" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input name="password" type="password" minLength={8} required />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Admin account created.</p> : null}
      <SubmitButton />
    </form>
  );
}
