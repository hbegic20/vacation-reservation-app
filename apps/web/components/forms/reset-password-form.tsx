'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetEmployeePasswordAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Resetting...' : 'Reset Password'}
    </Button>
  );
}

export function ResetPasswordForm({ employeeId }: { employeeId: string }) {
  const [state, formAction] = useFormState(resetEmployeePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="space-y-2">
        <label className="text-sm font-medium">New Temporary Password</label>
        <Input name="newPassword" minLength={8} required placeholder="Minimum 8 characters" />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Password reset successful.</p> : null}
      <SubmitButton />
    </form>
  );
}
