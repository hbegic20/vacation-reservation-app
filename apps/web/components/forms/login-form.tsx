'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Field } from '../ui/field';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';

const initialState = { error: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="min-h-12 w-full text-[15px]" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field id="email" label="Work email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>
      <Field id="password" label="Password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton />
    </form>
  );
}
