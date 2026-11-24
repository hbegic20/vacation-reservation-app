import { MonthRef, monthCells, weekdayNames } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { DayRequests, activeRequests, describeDay, kindOf, kindStyles, shortName } from './calendar-day';

const visibleNames = 3;

interface MonthViewProps {
  month: MonthRef;
  byDate: ReadonlyMap<string, DayRequests>;
  holidayNames: ReadonlyMap<string, string>;
  selectedDate: string;
  today: string;
  onSelect: (key: string) => void;
}

export function MonthView({ month, byDate, holidayNames, selectedDate, today, onSelect }: MonthViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40" aria-hidden="true">
        {weekdayNames.map((weekday, index) => (
          <span
            key={weekday}
            className={cn(
              'py-2.5 text-center text-xs font-semibold uppercase tracking-wide',
              index >= 5 ? 'text-muted-foreground/70' : 'text-muted-foreground'
            )}
          >
            {weekday}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthCells(month).map((cell, index) => {
          if (!cell) {
            return <span key={`blank-${index}`} aria-hidden="true" className="border-b border-r border-border bg-muted/30" />;
          }
          const people = activeRequests(byDate.get(cell.key) ?? []);
          const holidayName = holidayNames.get(cell.key);
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === today;
          return (
            <button
              key={cell.key}
              type="button"
              aria-label={describeDay(cell.key, byDate.get(cell.key) ?? [], holidayName)}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.key)}
              className={cn(
                'flex min-h-16 flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors sm:min-h-28 sm:p-2',
                cell.isWeekend || holidayName ? 'bg-muted/40' : 'bg-card',
                isSelected ? 'relative z-10 ring-2 ring-inset ring-primary' : 'hover:bg-muted/60'
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full text-sm',
                    isToday ? 'bg-primary font-bold text-white' : 'font-semibold',
                    !isToday && cell.isWeekend ? 'text-muted-foreground' : ''
                  )}
                >
                  {cell.day}
                </span>
                {people.length > 0 ? (
                  <span className="text-[11px] font-semibold text-muted-foreground sm:hidden">{people.length}</span>
                ) : null}
              </span>
              {holidayName ? (
                <span className="truncate text-[11px] font-semibold text-sick">{holidayName}</span>
              ) : null}
              <span className="hidden flex-col gap-1 sm:flex">
                {people.slice(0, visibleNames).map((request) => (
                  <span
                    key={request.id}
                    className={cn('truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold', kindStyles[kindOf(request)].pill)}
                  >
                    {shortName(request)}
                  </span>
                ))}
                {people.length > visibleNames ? (
                  <span className="px-1 text-[11px] font-semibold text-muted-foreground">
                    +{people.length - visibleNames} more
                  </span>
                ) : null}
              </span>
              <span className="flex flex-wrap gap-1 sm:hidden" aria-hidden="true">
                {people.slice(0, 4).map((request) => (
                  <span key={request.id} className={cn('h-1.5 w-1.5 rounded-full', kindStyles[kindOf(request)].dot)} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
