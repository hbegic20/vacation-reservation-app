'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { deleteHolidayAction } from '@/app/actions';

const initialState = { success: false, error: null as string | null };

function RemoveButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Remove ${name}`}
      className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"
    >
      {pending ? 'Removing...' : 'Remove'}
    </button>
  );
}

export function DeleteHolidayForm({ holidayId, name }: { holidayId: string; name: string }) {
  const [state, formAction] = useFormState(deleteHolidayAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="holidayId" value={holidayId} />
      {state.error ? (
        <span role="alert" className="text-[13px] font-semibold text-danger">
          {state.error}
        </span>
      ) : null}
      <RemoveButton name={name} />
    </form>
  );
}
