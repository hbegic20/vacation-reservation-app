'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { uploadDocumentAction } from '@/app/actions';
import { useResetOnSuccess } from '@/components/forms/use-reset-on-success';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { acceptedDocumentTypes } from '@/lib/documents';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Uploading...' : 'Upload as draft'}
    </Button>
  );
}

export function UploadDocumentForm() {
  const [state, formAction] = useFormState(uploadDocumentAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Field id="document-file" label="File" hint="PDF, PNG, JPG, WebP, Word (.docx) or Excel (.xlsx), up to 10 MB.">
        <input
          id="document-file"
          name="file"
          type="file"
          required
          accept={acceptedDocumentTypes}
          className="block w-full rounded-xl border border-dashed border-input bg-card p-3 text-sm text-muted-foreground file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:text-sm file:font-semibold file:text-primary-text"
        />
      </Field>
      <Field id="document-title" label="Title">
        <Input id="document-title" name="title" required minLength={2} maxLength={120} placeholder="Holiday policy 2027" />
      </Field>
      <Field id="document-description" label="Description" hint="Optional. Shown to employees in the feed.">
        <Textarea id="document-description" name="description" rows={3} maxLength={500} />
      </Field>
      <FormMessage
        state={state}
        successTitle="Uploaded as a draft"
        successText="Check the preview, then publish it when it’s ready for employees."
      />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
