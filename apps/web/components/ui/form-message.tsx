import { ReactNode } from 'react';
import { Icon, IconName } from './icon';

interface FormMessageProps {
  state: { success?: boolean; error?: string | null };
  successTitle?: string;
  successText?: string;
  successAction?: ReactNode;
}

interface CalloutProps {
  tone: 'success' | 'danger';
  role: 'status' | 'alert';
  title: string;
  text?: string;
  action?: ReactNode;
}

const toneStyles: Record<CalloutProps['tone'], { box: string; icon: IconName }> = {
  success: { box: 'border-success/40 bg-success-soft text-success', icon: 'checkCircle' },
  danger: { box: 'border-danger/40 bg-danger-soft text-danger', icon: 'alertCircle' }
};

function Callout({ tone, role, title, text, action }: CalloutProps) {
  return (
    <div role={role} className={`flex gap-3 rounded-xl border px-4 py-3.5 ${toneStyles[tone].box}`}>
      <Icon name={toneStyles[tone].icon} size={22} className="mt-px shrink-0" />
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <p className="font-semibold">{title}</p>
        {text ? <p className="text-foreground">{text}</p> : null}
        {action ? <div className="mt-1.5">{action}</div> : null}
      </div>
    </div>
  );
}

export function FormMessage({ state, successTitle, successText, successAction }: FormMessageProps) {
  if (state.error) {
    return <Callout tone="danger" role="alert" title={state.error} />;
  }

  const title = successTitle ?? successText;
  if (state.success && title) {
    return (
      <Callout
        tone="success"
        role="status"
        title={title}
        text={successTitle ? successText : undefined}
        action={successAction}
      />
    );
  }

  return null;
}
