'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { deleteDocumentAction, setDocumentPublishedAction } from '@/app/actions';
import { Button } from '@/components/ui/button';

const initialState = { success: false, error: null as string | null };

function PublishButton({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus();
  if (pending) {
    return (
      <Button type="submit" variant={isPublished ? 'secondary' : 'primary'} disabled>
        Saving...
      </Button>
    );
  }
  return (
    <Button type="submit" variant={isPublished ? 'secondary' : 'primary'}>
      {isPublished ? 'Unpublish' : 'Publish to employees'}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? 'Deleting...' : 'Yes, delete'}
    </Button>
  );
}

interface DocumentAdminActionsProps {
  documentId: string;
  title: string;
  isPublished: boolean;
}

export function DocumentAdminActions({ documentId, title, isPublished }: DocumentAdminActionsProps) {
  const [publishState, publishAction] = useFormState(setDocumentPublishedAction, initialState);
  const [deleteState, deleteAction] = useFormState(deleteDocumentAction, initialState);
  const error = publishState.error ?? deleteState.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-2">
        <form action={publishAction}>
          <input type="hidden" name="documentId" value={documentId} />
          <input type="hidden" name="isPublished" value={isPublished ? 'false' : 'true'} />
          <PublishButton isPublished={isPublished} />
        </form>
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Delete</span>
            <span className="hidden group-open:inline">Keep it</span>
          </summary>
          <form
            action={deleteAction}
            className="mt-2 flex flex-col gap-2 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm"
          >
            <input type="hidden" name="documentId" value={documentId} />
            <p>Delete “{title}” for everyone? This can’t be undone.</p>
            <div>
              <DeleteButton />
            </div>
          </form>
        </details>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
