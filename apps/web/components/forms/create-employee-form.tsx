'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createEmployeeAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-12 px-6 text-[15px]">
      {pending ? 'Creating...' : 'Create account'}
    </Button>
  );
}

export function CreateEmployeeForm() {
  const [state, formAction] = useFormState(createEmployeeAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="First name">
          <Input id="firstName" name="firstName" type="text" autoComplete="off" required />
        </Field>
        <Field id="lastName" label="Last name">
          <Input id="lastName" name="lastName" type="text" autoComplete="off" required />
        </Field>
      </div>
      <Field id="email" label="Work email">
        <Input id="email" name="email" type="email" autoComplete="off" required placeholder="name@company.com" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="department" label="Department" hint="Optional">
          <Input id="department" name="department" type="text" placeholder="Engineering" />
        </Field>
        <Field id="vacationDaysTotal" label="Vacation days per year">
          <Input id="vacationDaysTotal" name="vacationDaysTotal" type="number" required min={1} max={365} defaultValue={25} />
        </Field>
      </div>
      <Field
        id="temporaryPassword"
        label="Temporary password"
        hint="At least 8 characters. Share it with the employee so they can sign in."
      >
        <Input id="temporaryPassword" name="temporaryPassword" type="text" autoComplete="off" required minLength={8} />
      </Field>
      <FormMessage state={state} successText="Account created. You can add another one." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
