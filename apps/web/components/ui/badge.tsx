import { VacationStatus } from '@vacation/shared';
import { statusLabels } from '@/lib/labels';

const statusStyles: Record<VacationStatus, string> = {
  PENDING: 'bg-warning-soft text-warning',
  APPROVED: 'bg-success-soft text-success',
  REJECTED: 'bg-danger-soft text-danger',
  CANCELLED: 'bg-muted text-muted-foreground'
};

const statusIconPaths: Record<VacationStatus, string> = {
  PENDING: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2',
  APPROVED: 'M5 12.5l4.5 4.5L19 7.5',
  REJECTED: 'M6 6l12 12M18 6L6 18',
  CANCELLED: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8'
};

export function StatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${statusStyles[status]}`}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={statusIconPaths[status]} />
      </svg>
      {statusLabels[status]}
    </span>
  );
}
