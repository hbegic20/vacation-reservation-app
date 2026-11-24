'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { cancelVacationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';

const initialState = { success: false, error: null as string | null };

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? 'Cancelling...' : 'Yes, cancel it'}
    </Button>
  );
}

interface CancelRequestFormProps {
  requestId: string;
  refundsDays: boolean;
}

export function CancelRequestForm({ requestId, refundsDays }: CancelRequestFormProps) {
  const [state, formAction] = useFormState(cancelVacationAction, initialState);

  return (
    <details className="group">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Cancel request</span>
        <span className="hidden group-open:inline">Keep request</span>
      </summary>
      <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm">
        <input type="hidden" name="requestId" value={requestId} />
        <p>
          {refundsDays
            ? 'Cancel this time off? The days go back to your balance and admins are notified.'
            : 'Cancel this request? Admins are notified.'}
        </p>
        {state.error ? (
          <p role="alert" className="font-semibold text-danger">
            {state.error}
          </p>
        ) : null}
        <div>
          <ConfirmButton />
        </div>
      </form>
    </details>
  );
}
