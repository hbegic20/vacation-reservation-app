'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resetEmployeePasswordAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Resetting...' : 'Reset password'}
    </Button>
  );
}

export function ResetPasswordForm({ employeeId }: { employeeId: string }) {
  const [state, formAction] = useFormState(resetEmployeePasswordAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <Field
        id="employee-new-password"
        label="New temporary password"
        hint="At least 8 characters. The old password stops working right away."
      >
        <Input id="employee-new-password" name="newPassword" autoComplete="off" minLength={8} required />
      </Field>
      <FormMessage state={state} successText="Password reset. Share the new one with the employee." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
