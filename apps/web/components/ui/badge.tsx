import { VacationStatus } from '@vacation/shared';

const statusStyles: Record<VacationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
};

export function StatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
