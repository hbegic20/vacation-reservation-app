'use client';

import { useEffect, useRef } from 'react';

export function useResetOnSuccess(state: { success: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return formRef;
}
