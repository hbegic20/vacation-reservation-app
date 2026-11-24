import Link from 'next/link';
import { VacationRequest } from '@vacation/shared';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { countWorkingDays, dayOfMonth, daysUntil, formatDateRange, monthShort } from '@/lib/dates';

function startsInLabel(days: number): string {
  if (days <= 0) {
    return 'Starts today';
  }
  return days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`;
}

export function NextTimeOffCard({ vacation }: { vacation: VacationRequest | undefined }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-[17px] font-semibold">Next time off</h2>
      {vacation ? (
        <>
          <div className="flex items-center gap-4">
            <div className="w-16 shrink-0 overflow-hidden rounded-xl border border-border text-center" aria-hidden="true">
              <div className="bg-primary py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                {monthShort(vacation.startDate)}
              </div>
              <div className="font-display text-[26px] font-bold leading-10">{dayOfMonth(vacation.startDate)}</div>
            </div>
            <div>
              <p className="text-base font-semibold">{formatDateRange(vacation.startDate, vacation.endDate)}</p>
              <p className="text-sm text-muted-foreground">
                {countWorkingDays(vacation.startDate, vacation.endDate)} working days
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={vacation.status} />
            <p className="text-sm text-muted-foreground">{startsInLabel(daysUntil(vacation.startDate))}</p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-start justify-center gap-2">
          <p className="text-sm text-muted-foreground">Nothing booked yet.</p>
          <Link href="/vacations/request" className="text-sm font-semibold text-primary-text">
            Plan your next break
          </Link>
        </div>
      )}
    </Card>
  );
}
