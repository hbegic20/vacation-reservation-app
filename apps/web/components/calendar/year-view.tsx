import Link from 'next/link';
import { MonthRef, monthCells, monthName, weekdayNames } from '@/lib/calendar';
import { plural } from '@/lib/people';
import { cn } from '@/lib/utils';
import { AbsenceKind, DayRequests, activeRequests, describeDay, dominantKind } from './calendar-day';

const cellTones: Record<AbsenceKind, string> = {
  vacation: 'bg-primary text-white',
  sick: 'bg-sick-soft text-sick ring-1 ring-inset ring-sick',
  pending: 'border-2 border-dashed border-warning bg-warning-soft text-warning'
};

const holidayTone = 'text-sick ring-1 ring-inset ring-sick/50';

interface YearViewProps {
  year: number;
  byDate: ReadonlyMap<string, DayRequests>;
  holidayNames: ReadonlyMap<string, string>;
  selectedDate: string;
  today: string;
  monthHref: (month: MonthRef) => string;
  onSelect: (key: string) => void;
}

function daysWithAbsences(month: MonthRef, byDate: ReadonlyMap<string, DayRequests>): number {
  return monthCells(month).filter((cell) => cell && activeRequests(byDate.get(cell.key) ?? []).length > 0).length;
}

export function YearView({ year, byDate, holidayNames, selectedDate, today, monthHref, onSelect }: YearViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const month = { year, monthIndex };
        const busyDays = daysWithAbsences(month, byDate);
        return (
          <section
            key={monthIndex}
            aria-label={`${monthName(month)} ${year}`}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <Link
                href={monthHref(month)}
                className="font-display text-[15px] font-semibold hover:text-primary-text hover:underline"
              >
                {monthName(month)}
              </Link>
              <span className="text-xs text-muted-foreground">
                {busyDays === 0 ? 'Everyone in' : `${plural(busyDays, 'day')} with absences`}
              </span>
            </div>
            <div
              className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground"
              aria-hidden="true"
            >
              {weekdayNames.map((weekday) => (
                <span key={weekday}>{weekday.charAt(0)}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]">
              {monthCells(month).map((cell, index) => {
                if (!cell) {
                  return <span key={`blank-${index}`} aria-hidden="true" />;
                }
                const requests = byDate.get(cell.key) ?? [];
                const people = activeRequests(requests);
                const kind = dominantKind(requests);
                const holidayName = holidayNames.get(cell.key);
                const isToday = cell.key === today;
                if (!kind && !holidayName) {
                  return (
                    <span
                      key={cell.key}
                      className={cn(
                        'grid h-8 place-items-center rounded-lg',
                        cell.isWeekend ? 'text-muted-foreground/70' : '',
                        isToday ? 'bg-foreground font-bold text-background' : ''
                      )}
                    >
                      {cell.day}
                    </span>
                  );
                }
                return (
                  <button
                    key={cell.key}
                    type="button"
                    aria-label={describeDay(cell.key, requests, holidayName)}
                    aria-pressed={cell.key === selectedDate}
                    onClick={() => onSelect(cell.key)}
                    className={cn(
                      'relative grid h-8 place-items-center rounded-lg font-semibold transition',
                      kind ? cellTones[kind] : holidayTone,
                      cell.key === selectedDate ? 'outline outline-2 outline-offset-2 outline-foreground' : '',
                      isToday ? 'underline decoration-2 underline-offset-2' : ''
                    )}
                  >
                    {cell.day}
                    {people.length > 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background"
                      >
                        {people.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
