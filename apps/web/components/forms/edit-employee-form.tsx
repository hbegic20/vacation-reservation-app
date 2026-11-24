'use client';

import { EmployeeListItem } from '@vacation/shared';
import { useFormState, useFormStatus } from 'react-dom';
import { updateEmployeeAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-12 px-6 text-[15px]">
      {pending ? 'Saving...' : 'Save changes'}
    </Button>
  );
}

export function EditEmployeeForm({ employee }: { employee: EmployeeListItem }) {
  const [state, formAction] = useFormState(updateEmployeeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="employeeId" value={employee.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="employee-first-name" label="First name">
          <Input id="employee-first-name" name="firstName" defaultValue={employee.firstName} required />
        </Field>
        <Field id="employee-last-name" label="Last name">
          <Input id="employee-last-name" name="lastName" defaultValue={employee.lastName} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="employee-department" label="Department" hint="Optional">
          <Input
            id="employee-department"
            name="department"
            defaultValue={employee.department ?? ''}
            placeholder="Engineering"
          />
        </Field>
        <Field
          id="employee-vacation-days"
          label="Vacation days per year"
          hint={`${employee.vacationDaysUsed} already used this year`}
        >
          <Input
            id="employee-vacation-days"
            name="vacationDaysTotal"
            type="number"
            min={1}
            max={365}
            defaultValue={employee.vacationDaysTotal}
            required
          />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={employee.isActive}
          className="h-5 w-5 accent-primary"
        />
        <span>
          <span className="font-semibold">Account is active</span>
          <span className="block text-[13px] text-muted-foreground">Inactive employees can’t sign in.</span>
        </span>
      </label>
      <FormMessage state={state} successText="Changes saved." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
