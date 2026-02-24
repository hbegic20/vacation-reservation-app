'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initialState = { error: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" required placeholder="you@company.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
