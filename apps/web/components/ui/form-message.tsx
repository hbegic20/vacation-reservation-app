interface FormMessageProps {
  state: { success?: boolean; error?: string | null };
  successText?: string;
}

export function FormMessage({ state, successText }: FormMessageProps) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  }

  if (state.success && successText) {
    return (
      <p role="status" className="text-sm font-medium text-success">
        {successText}
      </p>
    );
  }

  return null;
}
