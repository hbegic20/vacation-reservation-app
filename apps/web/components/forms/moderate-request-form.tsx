'use client';

import { useEffect, useId } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { moderateVacationAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

type ModerationAction = 'approve' | 'reject';

const initialState = { success: false, error: null as string | null };

const actionLabels: Record<ModerationAction, { idle: string; pending: string }> = {
  approve: { idle: 'Approve', pending: 'Approving...' },
  reject: { idle: 'Reject', pending: 'Rejecting...' }
};

function DecisionButton({ action }: { action: ModerationAction }) {
  const { pending, data } = useFormStatus();
  const isThisActionPending = pending && data?.get('action') === action;

  return (
    <Button
      type="submit"
      name="action"
      value={action}
      variant={action === 'approve' ? 'primary' : 'danger'}
      disabled={pending}
    >
      {isThisActionPending ? actionLabels[action].pending : actionLabels[action].idle}
    </Button>
  );
}

interface ModerateRequestFormProps {
  requestId: string;
  onDecided: () => void;
}

export function ModerateRequestForm({ requestId, onDecided }: ModerateRequestFormProps) {
  const [state, formAction] = useFormState(moderateVacationAction, initialState);
  const commentId = useId();

  useEffect(() => {
    if (state.success) {
      onDecided();
    }
  }, [state, onDecided]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="space-y-2">
        <label htmlFor={commentId} className="text-sm font-medium">
          Comment (optional)
        </label>
        <Textarea
          id={commentId}
          name="adminComment"
          rows={3}
          placeholder="Shown to the employee, e.g. the reason for a rejection"
        />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div className="flex gap-2">
        <DecisionButton action="approve" />
        <DecisionButton action="reject" />
      </div>
    </form>
  );
}
