'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createHolidayAction } from '@/app/actions';
import { useResetOnSuccess } from '@/components/forms/use-reset-on-success';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';

const initialState = { success: false, error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adding...' : 'Add holiday'}
    </Button>
  );
}

export function CreateHolidayForm({ year }: { year: number }) {
  const [state, formAction] = useFormState(createHolidayAction, initialState);
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Field id="holiday-date" label="Date">
        <Input
          id="holiday-date"
          name="date"
          type="date"
          required
          min={`${year}-01-01`}
          max={`${year}-12-31`}
        />
      </Field>
      <Field id="holiday-name" label="Name">
        <Input id="holiday-name" name="name" required minLength={2} maxLength={100} placeholder="Statehood Day" />
      </Field>
      <FormMessage state={state} successText="Holiday added." />
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
