'use client';

import { EmployeeListItem } from '@vacation/shared';
import { useFormState, useFormStatus } from 'react-dom';
import { createSickLeaveAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Record sick leave'}
    </Button>
  );
}

export function CreateSickLeaveForm({ employees }: { employees: EmployeeListItem[] }) {
  const [state, formAction] = useFormState(createSickLeaveAction, initialState);
  const formRef = useResetOnSuccess(state);
  const activeEmployees = employees.filter((employee) => employee.isActive);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Field id="sick-leave-employee" label="Employee">
        <Select id="sick-leave-employee" name="userId" required defaultValue="" className="w-full">
          <option value="" disabled>
            Choose an employee
          </option>
          {activeEmployees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName}
              {employee.department ? ` · ${employee.department}` : ''}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sick-leave-start" label="First day">
          <Input id="sick-leave-start" name="startDate" type="date" required />
        </Field>
        <Field id="sick-leave-end" label="Last day">
          <Input id="sick-leave-end" name="endDate" type="date" required />
        </Field>
      </div>
      <Field id="sick-leave-reason" label="Reason">
        <Textarea id="sick-leave-reason" name="reason" rows={2} required placeholder="Doctor advised rest" />
      </Field>
      <Field id="sick-leave-comment" label="Admin note" hint="Optional. Shown to the employee.">
        <Textarea id="sick-leave-comment" name="adminComment" rows={2} placeholder="Medical note received" />
      </Field>
      <FormMessage state={state} successText="Sick leave recorded." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
