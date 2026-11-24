'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createAdminAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adding...' : 'Add admin'}
    </Button>
  );
}

export function CreateAdminForm() {
  const [state, formAction] = useFormState(createAdminAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="admin-first-name" label="First name">
          <Input id="admin-first-name" name="firstName" autoComplete="off" required />
        </Field>
        <Field id="admin-last-name" label="Last name">
          <Input id="admin-last-name" name="lastName" autoComplete="off" required />
        </Field>
      </div>
      <Field id="admin-email" label="Work email">
        <Input id="admin-email" name="email" type="email" autoComplete="off" required />
      </Field>
      <Field id="admin-department" label="Department" hint="Optional">
        <Input id="admin-department" name="department" placeholder="Operations" />
      </Field>
      <Field id="admin-password" label="Password" hint="At least 8 characters.">
        <Input id="admin-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormMessage state={state} successText="Admin added." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
