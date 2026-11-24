'use client';

import { PublicHoliday, VacationCalendarDay } from '@vacation/shared';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { MonthRef, monthCells, monthQuery } from '@/lib/calendar';
import { toDateKey } from '@/lib/dates';
import { DayRequests, entriesFromRequests } from './calendar-day';
import { DayDetails } from './day-details';
import { MonthView } from './month-view';
import { YearView } from './year-view';

export type CalendarView = 'month' | 'year';

interface CompanyCalendarProps {
  view: CalendarView;
  month: MonthRef;
  today: string;
  days: VacationCalendarDay[];
  holidays: PublicHoliday[];
  department: string | null;
  sidePanelFooter: ReactNode;
}

function periodKeys(view: CalendarView, month: MonthRef): string[] {
  const months = view === 'month' ? [month] : Array.from({ length: 12 }, (_, monthIndex) => ({ year: month.year, monthIndex }));
  return months.flatMap((period) => monthCells(period).flatMap((cell) => (cell ? [cell.key] : [])));
}

function initialSelection(keys: string[], byDate: ReadonlyMap<string, DayRequests>, today: string): string {
  if (keys.includes(today)) {
    return today;
  }
  return keys.find((key) => (byDate.get(key) ?? []).length > 0) ?? keys[0];
}

export function CompanyCalendar({ view, month, today, days, holidays, department, sidePanelFooter }: CompanyCalendarProps) {
  const byDate = useMemo(() => new Map(days.map((entry) => [entry.date, entry.requests])), [days]);
  const entries = useMemo(
    () => new Map(days.map((entry) => [entry.date, entriesFromRequests(entry.requests)])),
    [days]
  );
  const holidayNames = useMemo(
    () => new Map(holidays.map((holiday) => [toDateKey(holiday.date), holiday.name])),
    [holidays]
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    initialSelection(periodKeys(view, month), byDate, today)
  );
  const detailsRef = useRef<HTMLElement>(null);

  const selectDate = (key: string) => {
    setSelectedDate(key);
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      detailsRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const monthHref = (target: MonthRef) => {
    const params = new URLSearchParams({ view: 'month', month: monthQuery(target) });
    if (department) {
      params.set('department', department);
    }
    return `/admin/calendar?${params.toString()}`;
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      {view === 'month' ? (
        <MonthView
          month={month}
          entries={entries}
          holidayNames={holidayNames}
          selectedDate={selectedDate}
          today={today}
          onSelect={selectDate}
        />
      ) : (
        <YearView
          year={month.year}
          byDate={byDate}
          holidayNames={holidayNames}
          selectedDate={selectedDate}
          today={today}
          monthHref={monthHref}
          onSelect={selectDate}
        />
      )}
      <div className="flex flex-col gap-5 xl:sticky xl:top-24">
        <section
          ref={detailsRef}
          aria-labelledby="day-details-title"
          aria-live="polite"
          className="flex scroll-mt-24 flex-col gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <h2 id="day-details-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Day details
          </h2>
          <DayDetails
            selectedDate={selectedDate}
            requests={byDate.get(selectedDate) ?? []}
            holidayName={holidayNames.get(selectedDate)}
          />
        </section>
        {sidePanelFooter}
      </div>
    </div>
  );
}
