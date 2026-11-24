'use client';

import { useId } from 'react';
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
      className="px-5"
    >
      {isThisActionPending ? actionLabels[action].pending : actionLabels[action].idle}
    </Button>
  );
}

interface ModerateRequestFormProps {
  requestId: string;
  employeeFirstName: string;
}

export function ModerateRequestForm({ requestId, employeeFirstName }: ModerateRequestFormProps) {
  const [state, formAction] = useFormState(moderateVacationAction, initialState);
  const commentId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={commentId} className="text-sm font-semibold">
          Comment for {employeeFirstName} (optional)
        </label>
        <Textarea
          id={commentId}
          name="adminComment"
          rows={2}
          placeholder="Shown to the employee, e.g. the reason for a rejection"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        <DecisionButton action="approve" />
        <DecisionButton action="reject" />
      </div>
    </form>
  );
}
