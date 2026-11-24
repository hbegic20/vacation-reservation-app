'use client';

import { EmployeeListItem } from '@vacation/shared';
import { useFormState, useFormStatus } from 'react-dom';
import { createSickLeaveAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Saving...' : 'Add Sick Leave'}
    </Button>
  );
}

export function CreateSickLeaveForm({ employees }: { employees: EmployeeListItem[] }) {
  const [state, formAction] = useFormState(createSickLeaveAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h3 className="text-sm font-semibold">Mark Sick Leave (Admin)</h3>
      <div className="space-y-2">
        <label htmlFor="sick-leave-employee" className="text-xs text-muted-foreground">Employee</label>
        <select
          id="sick-leave-employee"
          name="userId"
          className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select employee
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.firstName} {employee.lastName} ({employee.email})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="sick-leave-start" className="text-xs text-muted-foreground">Start</label>
          <Input id="sick-leave-start" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="sick-leave-end" className="text-xs text-muted-foreground">End</label>
          <Input id="sick-leave-end" name="endDate" type="date" required />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="sick-leave-reason" className="text-xs text-muted-foreground">Reason</label>
        <Textarea id="sick-leave-reason" name="reason" rows={2} required placeholder="Fever / doctor advised rest" />
      </div>
      <div className="space-y-2">
        <label htmlFor="sick-leave-comment" className="text-xs text-muted-foreground">Admin Comment (optional)</label>
        <Textarea id="sick-leave-comment" name="adminComment" rows={2} placeholder="Attachment verified" />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Sick leave recorded.</p> : null}
      <SubmitButton />
    </form>
  );
}
