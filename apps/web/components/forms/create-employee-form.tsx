'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createEmployeeAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Employee'}
    </Button>
  );
}

export function CreateEmployeeForm() {
  const [state, formAction] = useFormState(createEmployeeAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="firstName">
            First Name
          </label>
          <Input id="firstName" name="firstName" type="text" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="lastName">
            Last Name
          </label>
          <Input id="lastName" name="lastName" type="text" required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Employee Email
        </label>
        <Input id="email" name="email" type="email" required placeholder="employee@company.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="department">
          Department
        </label>
        <Input id="department" name="department" type="text" placeholder="Engineering" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="temporaryPassword">
          Temporary Password
        </label>
        <Input
          id="temporaryPassword"
          name="temporaryPassword"
          type="text"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vacationDaysTotal">
          Total Vacation Days
        </label>
        <Input
          id="vacationDaysTotal"
          name="vacationDaysTotal"
          type="number"
          required
          min={1}
          max={365}
          defaultValue={25}
        />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Employee account created.</p> : null}

      <SubmitButton />
    </form>
  );
}
