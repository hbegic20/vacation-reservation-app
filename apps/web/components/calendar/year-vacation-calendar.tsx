'use client';

import { VacationCalendarDay, VacationCalendarRequestItem } from '@vacation/shared';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { countWorkingDays, formatDateRange, formatLongDate } from '@/lib/dates';
import { absenceTypeLabels, statusLabels } from '@/lib/labels';
import { plural } from '@/lib/people';
import { cn } from '@/lib/utils';

type DayRequests = VacationCalendarRequestItem[];

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });

interface CalendarCell {
  key: string;
  day: number;
  isWeekend: boolean;
}

function monthCells(year: number, monthIndex: number): (CalendarCell | null)[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  const cells: (CalendarCell | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    const weekday = date.getUTCDay();
    cells.push({ key: date.toISOString().slice(0, 10), day, isWeekend: weekday === 0 || weekday === 6 });
  }
  return cells;
}

function activeRequests(requests: DayRequests): DayRequests {
  return requests.filter((request) => request.status !== 'REJECTED');
}

function cellTone(requests: DayRequests): string {
  const active = activeRequests(requests);
  if (active.some((request) => request.absenceType === 'SICK')) {
    return 'bg-sick-soft text-sick ring-1 ring-inset ring-sick';
  }
  if (active.some((request) => request.status === 'PENDING')) {
    return 'border-2 border-dashed border-warning bg-warning-soft text-warning';
  }
  if (active.length > 0) {
    return 'bg-primary text-white';
  }
  return 'text-muted-foreground underline decoration-dotted underline-offset-2';
}

function describeDay(key: string, requests: DayRequests): string {
  const counts = new Map<string, number>();
  requests.forEach((request) => {
    const label = request.absenceType === 'SICK' ? 'sick' : statusLabels[request.status].toLowerCase();
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  const parts = Array.from(counts, ([label, count]) => `${count} ${label}`);
  return `${formatLongDate(key)}: ${parts.join(', ')}`;
}

function initialSelection(days: VacationCalendarDay[], today: string): string | null {
  const todayEntry = days.find((entry) => entry.date === today);
  if (todayEntry) {
    return todayEntry.date;
  }
  return days.find((entry) => entry.date > today)?.date ?? days[0]?.date ?? null;
}

interface MonthProps {
  year: number;
  monthIndex: number;
  byDate: Map<string, DayRequests>;
  selectedDate: string | null;
  today: string;
  onSelect: (key: string) => void;
}

function Month({ year, monthIndex, byDate, selectedDate, today, onSelect }: MonthProps) {
  const monthName = monthFormatter.format(new Date(Date.UTC(year, monthIndex, 1)));

  return (
    <section aria-label={`${monthName} ${year}`} className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-2 font-display text-[15px] font-semibold">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground" aria-hidden="true">
        {weekdayNames.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[13px]">
        {monthCells(year, monthIndex).map((cell, index) => {
          if (!cell) {
            return <span key={`blank-${index}`} aria-hidden="true" />;
          }
          const requests = byDate.get(cell.key);
          const isToday = cell.key === today;
          if (!requests) {
            return (
              <span
                key={cell.key}
                className={cn(
                  'grid h-9 place-items-center rounded-lg',
                  cell.isWeekend ? 'text-muted-foreground/70' : '',
                  isToday ? 'font-bold text-primary-text ring-2 ring-inset ring-primary' : ''
                )}
              >
                {cell.day}
              </span>
            );
          }
          const isSelected = cell.key === selectedDate;
          const peopleCount = activeRequests(requests).length;
          return (
            <button
              key={cell.key}
              type="button"
              aria-label={describeDay(cell.key, requests)}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.key)}
              className={cn(
                'relative grid h-9 place-items-center rounded-lg font-semibold transition',
                cellTone(requests),
                isSelected ? 'outline outline-2 outline-offset-2 outline-foreground' : '',
                isToday ? 'underline decoration-2 underline-offset-2' : ''
              )}
            >
              {cell.day}
              {peopleCount > 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background"
                >
                  {peopleCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayDetails({ selectedDate, requests }: { selectedDate: string | null; requests: DayRequests }) {
  if (!selectedDate) {
    return <p className="text-sm text-muted-foreground">No absences recorded this year.</p>;
  }

  return (
    <>
      <p className="text-sm font-semibold">{formatLongDate(selectedDate)}</p>
      <ul className="flex flex-col gap-2.5">
        {requests.map((request) => (
          <li key={request.id} className="rounded-xl bg-muted p-3.5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {request.user.firstName} {request.user.lastName}
                </p>
                {request.user.department ? (
                  <p className="text-[13px] text-muted-foreground">{request.user.department}</p>
                ) : null}
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-2">
              {absenceTypeLabels[request.absenceType]} · {formatDateRange(request.startDate, request.endDate)} ·{' '}
              {plural(countWorkingDays(request.startDate, request.endDate), 'working day')}
            </p>
            <p className="mt-0.5 text-muted-foreground">“{request.reason}”</p>
          </li>
        ))}
      </ul>
    </>
  );
}

interface YearVacationCalendarProps {
  year: number;
  today: string;
  days: VacationCalendarDay[];
  sidePanelFooter: ReactNode;
}

export function YearVacationCalendar({ year, today, days, sidePanelFooter }: YearVacationCalendarProps) {
  const byDate = useMemo(() => new Map(days.map((entry) => [entry.date, entry.requests])), [days]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => initialSelection(days, today));
  const detailsRef = useRef<HTMLElement>(null);

  const selectDate = (key: string) => {
    setSelectedDate(key);
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      detailsRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <Month
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            byDate={byDate}
            selectedDate={selectedDate}
            today={today}
            onSelect={selectDate}
          />
        ))}
      </div>
      <div className="flex flex-col gap-5 xl:sticky xl:top-24">
        <section
          ref={detailsRef}
          aria-labelledby="day-details-title"
          aria-live="polite"
          className="flex scroll-mt-24 flex-col gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <h2 id="day-details-title" className="font-display text-[17px] font-semibold">
            Day details
          </h2>
          <DayDetails selectedDate={selectedDate} requests={selectedDate ? (byDate.get(selectedDate) ?? []) : []} />
        </section>
        {sidePanelFooter}
      </div>
    </div>
  );
}
