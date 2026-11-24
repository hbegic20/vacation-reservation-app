'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  CalendarCell,
  MonthRef,
  addDays,
  addMonths,
  compareMonths,
  monthCells,
  monthOf,
  monthYearLabel,
  weekdayNames
} from '@/lib/calendar';
import { formatLongDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

export type BookedKind = 'approved' | 'pending' | 'sick';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  minDate: string;
  holidays: ReadonlyMap<string, string>;
  bookedDays: ReadonlyMap<string, BookedKind>;
  invalid: boolean;
}

const bookedLabels: Record<BookedKind, string> = {
  approved: 'already booked',
  pending: 'waiting for approval',
  sick: 'sick leave'
};

const keyboardSteps: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7
};

function isInRange(key: string, range: DateRange): boolean {
  return range.startDate !== '' && range.endDate !== '' && key > range.startDate && key < range.endDate;
}

function nextRange(range: DateRange, key: string): DateRange {
  const hasStartOnly = range.startDate !== '' && range.endDate === '';
  if (hasStartOnly && key >= range.startDate) {
    return { startDate: range.startDate, endDate: key };
  }
  return { startDate: key, endDate: '' };
}

interface DayState {
  isPast: boolean;
  holidayName: string | undefined;
  booked: BookedKind | undefined;
  isStart: boolean;
  isEnd: boolean;
  isBetween: boolean;
}

function dayLabel(cell: CalendarCell, state: DayState): string {
  const parts = [formatLongDate(cell.key)];
  if (state.isStart) parts.push('first day off');
  if (state.isEnd) parts.push('last day off');
  if (state.holidayName) parts.push(`public holiday, ${state.holidayName}`);
  if (state.booked) parts.push(bookedLabels[state.booked]);
  if (state.isPast) parts.push('in the past');
  return parts.join(', ');
}

function dayClassName(cell: CalendarCell, state: DayState): string {
  if (state.isStart || state.isEnd) {
    return 'bg-primary font-bold text-white';
  }
  if (state.isBetween) {
    return cn('rounded-none bg-primary-soft text-primary-text', cell.isWeekend || state.holidayName ? 'opacity-70' : '');
  }
  if (state.booked === 'pending') {
    return 'border-2 border-dashed border-warning text-warning';
  }
  if (state.booked) {
    return 'bg-muted text-muted-foreground line-through';
  }
  if (state.isPast) {
    return 'text-muted-foreground/50';
  }
  if (state.holidayName) {
    return 'font-semibold text-sick ring-1 ring-inset ring-sick/50 hover:bg-sick-soft';
  }
  return cn('hover:bg-muted', cell.isWeekend ? 'text-muted-foreground' : 'text-foreground');
}

function MonthGrid({
  month,
  dayState,
  focusKey,
  onSelect,
  onKeyDown
}: {
  month: MonthRef;
  dayState: (cell: CalendarCell) => DayState;
  focusKey: string;
  onSelect: (key: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, key: string) => void;
}) {
  const label = monthYearLabel(month);

  return (
    <div role="group" aria-label={label} className="min-w-0 flex-1">
      <p className="mb-3 text-center font-display text-[15px] font-semibold">{label}</p>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" aria-hidden="true">
        {weekdayNames.map((weekday) => (
          <span key={weekday} className="pb-2">
            {weekday}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {monthCells(month).map((cell, index) => {
          if (!cell) {
            return <span key={`blank-${index}`} aria-hidden="true" />;
          }
          const state = dayState(cell);
          const isUnavailable = state.isPast || state.booked !== undefined;
          return (
            <button
              key={cell.key}
              type="button"
              data-date={cell.key}
              tabIndex={cell.key === focusKey ? 0 : -1}
              aria-label={dayLabel(cell, state)}
              aria-pressed={state.isStart || state.isEnd || state.isBetween}
              aria-disabled={isUnavailable}
              onClick={() => (isUnavailable ? undefined : onSelect(cell.key))}
              onKeyDown={(event) => onKeyDown(event, cell.key)}
              className={cn(
                'relative mx-auto grid h-10 w-full max-w-11 place-items-center rounded-lg transition-colors',
                isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer',
                dayClassName(cell, state)
              )}
            >
              {cell.day}
              {state.holidayName && !state.isStart && !state.isEnd ? (
                <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-sick" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ range, onChange, minDate, holidays, bookedDays, invalid }: DateRangePickerProps) {
  const [firstMonth, setFirstMonth] = useState<MonthRef>(() => monthOf(range.startDate || minDate));
  const [focusKey, setFocusKey] = useState(range.startDate || minDate);
  const shouldMoveFocus = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const earliestMonth = monthOf(minDate);
  const canGoBack = compareMonths(firstMonth, earliestMonth) > 0;

  useEffect(() => {
    if (!shouldMoveFocus.current) {
      return;
    }
    shouldMoveFocus.current = false;
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusKey}"]`)?.focus();
  }, [focusKey, firstMonth]);

  const dayState = (cell: CalendarCell): DayState => ({
    isPast: cell.key < minDate,
    holidayName: holidays.get(cell.key),
    booked: bookedDays.get(cell.key),
    isStart: cell.key === range.startDate,
    isEnd: cell.key === range.endDate,
    isBetween: isInRange(cell.key, range)
  });

  const moveFocus = (key: string) => {
    const target = monthOf(key);
    const visibleMonths = window.matchMedia('(min-width: 768px)').matches ? 2 : 1;
    const lastVisible = addMonths(firstMonth, visibleMonths - 1);
    if (compareMonths(target, firstMonth) < 0) {
      setFirstMonth(target);
    } else if (compareMonths(target, lastVisible) > 0) {
      setFirstMonth(addMonths(target, 1 - visibleMonths));
    }
    shouldMoveFocus.current = true;
    setFocusKey(key);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, key: string) => {
    const step = keyboardSteps[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    moveFocus(addDays(key, step));
  };

  const select = (key: string) => {
    setFocusKey(key);
    onChange(nextRange(range, key));
  };

  const showMonth = (offset: number) => {
    const next = addMonths(firstMonth, offset);
    setFirstMonth(next);
    setFocusKey(`${next.year}-${String(next.monthIndex + 1).padStart(2, '0')}-01`);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-2xl border bg-background/40 p-4 sm:p-5',
        invalid ? 'border-2 border-danger' : 'border-border'
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => showMonth(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <p className="text-[13px] text-muted-foreground">
          {range.startDate === '' ? 'Choose your first day off' : range.endDate === '' ? 'Now choose your last day off' : 'Dates selected'}
        </p>
        <button
          type="button"
          onClick={() => showMonth(1)}
          aria-label="Next month"
          className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
      <div className="flex gap-8">
        <MonthGrid month={firstMonth} dayState={dayState} focusKey={focusKey} onSelect={select} onKeyDown={handleKeyDown} />
        <div className="hidden min-w-0 flex-1 md:block">
          <MonthGrid
            month={addMonths(firstMonth, 1)}
            dayState={dayState}
            focusKey={focusKey}
            onSelect={select}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded bg-primary" />
          Selected
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded ring-1 ring-inset ring-sick/50" />
          Public holiday (not counted)
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded bg-muted" />
          Already booked
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded border-2 border-dashed border-warning" />
          Waiting for approval
        </li>
      </ul>
    </div>
  );
}
