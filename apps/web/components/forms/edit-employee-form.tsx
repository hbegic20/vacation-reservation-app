'use client';

import { EmployeeListItem } from '@vacation/shared';
import { useFormState, useFormStatus } from 'react-dom';
import { updateEmployeeAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

export function EditEmployeeForm({ employee }: { employee: EmployeeListItem }) {
  const [state, formAction] = useFormState(updateEmployeeAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employeeId" value={employee.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="employee-first-name" className="text-sm font-medium">First Name</label>
          <Input id="employee-first-name" name="firstName" defaultValue={employee.firstName} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="employee-last-name" className="text-sm font-medium">Last Name</label>
          <Input id="employee-last-name" name="lastName" defaultValue={employee.lastName} required />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="employee-department" className="text-sm font-medium">Department</label>
        <Input id="employee-department" name="department" defaultValue={employee.department ?? ''} placeholder="Engineering" />
      </div>

      <div className="space-y-2">
        <label htmlFor="employee-vacation-days" className="text-sm font-medium">Vacation Days Total</label>
        <Input
          id="employee-vacation-days"
          name="vacationDaysTotal"
          type="number"
          min={1}
          max={365}
          defaultValue={employee.vacationDaysTotal}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={employee.isActive} />
        Employee account is active
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Employee updated.</p> : null}
      <SubmitButton />
    </form>
  );
}
