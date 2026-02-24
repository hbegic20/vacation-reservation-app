'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { moderateVacationAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const initialState = { success: false, error: null as string | null };

function SubmitButton({ action }: { action: 'approve' | 'reject' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={action === 'approve' ? 'primary' : 'danger'} disabled={pending}>
      {pending ? 'Saving...' : action === 'approve' ? 'Approve' : 'Reject'}
    </Button>
  );
}

export function ModerateRequestForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useFormState(moderateVacationAction, initialState);

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="action" value="approve" />
        <Textarea name="adminComment" placeholder="Optional comment" rows={2} />
        <SubmitButton action="approve" />
      </form>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="action" value="reject" />
        <Textarea name="adminComment" placeholder="Optional rejection reason" rows={2} />
        <SubmitButton action="reject" />
      </form>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Updated.</p> : null}
    </div>
  );
}
