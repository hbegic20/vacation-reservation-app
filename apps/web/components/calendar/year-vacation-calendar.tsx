'use client';

import { VacationCalendarDay } from '@vacation/shared';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { useMemo, useState } from 'react';

interface YearVacationCalendarProps {
  year: number;
  days: VacationCalendarDay[];
}

const monthNames = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(2026, index, 1)));

function dateKey(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function cellTone(dayRequests: VacationCalendarDay['requests']): string {
  if (dayRequests.some((request) => request.absenceType === 'SICK')) {
    return 'bg-sky-200/80 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100';
  }
  if (dayRequests.some((request) => request.status === 'PENDING')) {
    return 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100';
  }
  if (dayRequests.some((request) => request.status === 'APPROVED')) {
    return 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100';
  }
  if (dayRequests.some((request) => request.status === 'REJECTED')) {
    return 'bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100';
  }
  return '';
}

export function YearVacationCalendar({ year, days }: YearVacationCalendarProps) {
  const byDate = useMemo(() => new Map(days.map((entry) => [entry.date, entry.requests])), [days]);
  const [selectedDate, setSelectedDate] = useState<string | null>(days[0]?.date ?? null);

  const selectedRequests = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <div className="grid gap-4 md:grid-cols-2">
        {monthNames.map((monthDate) => {
          const month = new Date(year, monthDate.getUTCMonth(), 1);
          const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
          const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
          const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

          return (
            <div
              key={month.toISOString()}
              className="rounded-2xl border border-border bg-card p-3 shadow-soft"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{format(month, 'MMMM yyyy')}</h3>
                <div className="text-[11px] text-muted-foreground">Hover and click date</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const requests = byDate.get(key) ?? [];
                  const isSelected = selectedDate === key;

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={`group relative rounded-md px-1 py-1.5 transition ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${isSameMonth(day, month) ? '' : 'text-muted-foreground/40'} ${cellTone(
                        requests
                      )}`}
                      onClick={() => setSelectedDate(key)}
                    >
                      {format(day, 'd')}
                      {requests.length > 0 ? (
                        <div className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-2 text-left shadow-xl group-hover:visible">
                          <p className="mb-1 text-[11px] font-semibold">{format(day, 'PPPP')}</p>
                          <div className="space-y-1 text-[11px]">
                            {requests.map((request) => (
                              <div key={request.id} className="rounded-md bg-muted p-1.5">
                                <p className="font-medium">
                                  {request.user.firstName} {request.user.lastName}
                                </p>
                                <p className="text-muted-foreground">
                                  {request.absenceType} · {request.status}
                                </p>
                                <p className="line-clamp-1 text-muted-foreground">{request.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-4 shadow-soft xl:sticky xl:top-20">
        <h3 className="text-sm font-semibold">Day Details</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {selectedDate ? format(new Date(selectedDate), 'PPPP') : 'Select a date'}
        </p>

        <div className="mt-3 space-y-2">
          {selectedDate && selectedRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests recorded for this date.</p>
          ) : null}

          {selectedRequests.map((request) => (
            <div key={request.id} className="rounded-xl bg-muted p-3 text-sm">
              <p className="font-semibold">
                {request.user.firstName} {request.user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.user.email}
                {request.user.department ? ` · ${request.user.department}` : ''}
              </p>
              <p className="mt-1 text-xs">
                {request.absenceType} · {request.status}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(request.startDate), 'yyyy-MM-dd')} -{' '}
                {format(new Date(request.endDate), 'yyyy-MM-dd')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{request.reason}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
