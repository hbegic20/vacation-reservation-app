import { CalendarCell, MonthRef, monthCells, weekdayNames } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { CalendarEntry, describeEntries, kindStyles } from './calendar-day';

const visibleNames = 3;

interface MonthViewProps {
  month: MonthRef;
  entries: ReadonlyMap<string, CalendarEntry[]>;
  holidayNames: ReadonlyMap<string, string>;
  today: string;
  selectedDate?: string;
  onSelect?: (key: string) => void;
}

function DayContent({
  cell,
  people,
  holidayName,
  isToday
}: {
  cell: CalendarCell;
  people: CalendarEntry[];
  holidayName: string | undefined;
  isToday: boolean;
}) {
  return (
    <>
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
      {holidayName ? <span className="truncate text-[11px] font-semibold text-sick">{holidayName}</span> : null}
      <span className="hidden flex-col gap-1 sm:flex">
        {people.slice(0, visibleNames).map((entry) => (
          <span
            key={entry.id}
            className={cn('truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold', kindStyles[entry.kind].pill)}
          >
            {entry.label}
          </span>
        ))}
        {people.length > visibleNames ? (
          <span className="px-1 text-[11px] font-semibold text-muted-foreground">+{people.length - visibleNames} more</span>
        ) : null}
      </span>
      <span className="flex flex-wrap gap-1 sm:hidden" aria-hidden="true">
        {people.slice(0, 4).map((entry) => (
          <span key={entry.id} className={cn('h-1.5 w-1.5 rounded-full', kindStyles[entry.kind].dot)} />
        ))}
      </span>
    </>
  );
}

export function MonthView({ month, entries, holidayNames, today, selectedDate, onSelect }: MonthViewProps) {
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
          const people = entries.get(cell.key) ?? [];
          const holidayName = holidayNames.get(cell.key);
          const description = describeEntries(cell.key, people, holidayName);
          const cellClassName = cn(
            'flex min-h-16 flex-col gap-1 border-b border-r border-border p-1.5 text-left sm:min-h-28 sm:p-2',
            cell.isWeekend || holidayName ? 'bg-muted/40' : 'bg-card'
          );
          const content = (
            <DayContent cell={cell} people={people} holidayName={holidayName} isToday={cell.key === today} />
          );

          if (!onSelect) {
            return (
              <div key={cell.key} className={cellClassName}>
                <span className="sr-only">{description}</span>
                <span aria-hidden="true" className="contents">
                  {content}
                </span>
              </div>
            );
          }

          const isSelected = cell.key === selectedDate;
          return (
            <button
              key={cell.key}
              type="button"
              aria-label={description}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.key)}
              className={cn(
                cellClassName,
                'transition-colors',
                isSelected ? 'relative z-10 ring-2 ring-inset ring-primary' : 'hover:bg-muted/60'
              )}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
