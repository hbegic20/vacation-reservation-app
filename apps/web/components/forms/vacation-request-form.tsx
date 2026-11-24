'use client';

import Link from 'next/link';
import { PublicHoliday, VacationRequest } from '@vacation/shared';
import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createVacationAction } from '@/app/actions';
import { overlapsRange } from '@/lib/absences';
import { addDays } from '@/lib/calendar';
import { countWorkingDays, formatDateRange, formatWeekdayDate, localDateKey, toDateKey } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { plural } from '@/lib/people';
import { Button, buttonStyles } from '../ui/button';
import { FormMessage } from '../ui/form-message';
import { Textarea } from '../ui/textarea';
import { BookedKind, DateRange, DateRangePicker } from './date-range-picker';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };
const emptyRange: DateRange = { startDate: '', endDate: '' };

function SubmitButton({ blocked }: { blocked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || blocked} className="min-h-12 px-6 text-[15px]">
      {pending ? 'Sending...' : 'Send request'}
    </Button>
  );
}

function overlapDescription(request: VacationRequest): string {
  if (request.absenceType === 'SICK') {
    return 'sick leave';
  }
  return request.status === 'PENDING' ? 'a pending request' : 'approved time off';
}

function rangeError(
  range: DateRange,
  workingDays: number,
  availableDays: number,
  existingRequests: VacationRequest[]
): string | null {
  if (range.startDate === '' || range.endDate === '') {
    return null;
  }
  if (range.endDate < range.startDate) {
    return 'The last day can’t be before the first day.';
  }
  const overlapping = existingRequests.find((request) =>
    overlapsRange(request, range.startDate, range.endDate)
  );
  if (overlapping) {
    return `These dates overlap ${overlapDescription(overlapping)} from ${formatDateRange(overlapping.startDate, overlapping.endDate)}.`;
  }
  if (workingDays === 0) {
    return 'Pick at least one working day.';
  }
  if (workingDays > availableDays) {
    return `You only have ${availableDays} days available.`;
  }
  return null;
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={emphasis ? 'font-semibold' : 'text-muted-foreground'}>{label}</dt>
      <dd className={emphasis ?? 'font-semibold'}>{value}</dd>
    </div>
  );
}

interface VacationRequestFormProps {
  availableDays: number;
  holidays: PublicHoliday[];
  existingRequests: VacationRequest[];
}

function bookedKind(request: VacationRequest): BookedKind {
  if (request.absenceType === 'SICK') {
    return 'sick';
  }
  return request.status === 'PENDING' ? 'pending' : 'approved';
}

function bookedDaysOf(requests: VacationRequest[]): Map<string, BookedKind> {
  const booked = new Map<string, BookedKind>();
  for (const request of requests) {
    const end = toDateKey(request.endDate);
    for (let key = toDateKey(request.startDate); key <= end; key = addDays(key, 1)) {
      booked.set(key, bookedKind(request));
    }
  }
  return booked;
}

function SelectedDay({ label, dateKey }: { label: string; dateKey: string }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col justify-center rounded-xl border px-3.5 py-2',
        dateKey ? 'border-primary/50 bg-primary-soft' : 'border-dashed border-input'
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('truncate text-sm font-semibold', dateKey ? 'text-foreground' : 'text-muted-foreground')}>
        {dateKey ? formatWeekdayDate(dateKey) : 'Not chosen'}
      </span>
    </div>
  );
}

function isWeekday(dateKey: string): boolean {
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

export function VacationRequestForm({ availableDays, holidays, existingRequests }: VacationRequestFormProps) {
  const [state, formAction] = useFormState(createVacationAction, initialState);
  const formRef = useResetOnSuccess(state);
  const [range, setRange] = useState<DateRange>(emptyRange);

  useEffect(() => {
    if (state.success) {
      setRange(emptyRange);
    }
  }, [state]);

  const hasRange = range.startDate !== '' && range.endDate !== '' && range.endDate >= range.startDate;
  const holidayNames = useMemo(
    () => new Map(holidays.map((holiday) => [toDateKey(holiday.date), holiday.name])),
    [holidays]
  );
  const holidayKeys = useMemo(() => new Set(holidayNames.keys()), [holidayNames]);
  const bookedDays = useMemo(() => bookedDaysOf(existingRequests), [existingRequests]);
  const workingDays = hasRange ? countWorkingDays(range.startDate, range.endDate, holidayKeys) : 0;
  const holidaysInRange = hasRange
    ? holidays.filter((holiday) => {
        const key = toDateKey(holiday.date);
        return key >= range.startDate && key <= range.endDate && isWeekday(key);
      })
    : [];
  const error = rangeError(range, workingDays, availableDays, existingRequests);
  const leftAfter = availableDays - workingDays;
  const today = localDateKey(new Date());

  return (
    <div className="flex flex-wrap items-start gap-5">
      <form
        ref={formRef}
        action={formAction}
        className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-2xl border border-border bg-card p-6"
      >
        <fieldset className="flex min-w-0 flex-col gap-3" aria-describedby={error ? 'date-error' : undefined}>
          <legend className="mb-3 text-sm font-semibold">Dates</legend>
          <div className="grid grid-cols-[1fr_1fr_auto] items-stretch gap-2.5">
            <SelectedDay label="First day off" dateKey={range.startDate} />
            <SelectedDay label="Last day off" dateKey={range.endDate} />
            <button
              type="button"
              onClick={() => setRange(emptyRange)}
              disabled={range.startDate === ''}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:invisible"
            >
              Clear
            </button>
          </div>
          <DateRangePicker
            range={range}
            onChange={setRange}
            minDate={today}
            holidays={holidayNames}
            bookedDays={bookedDays}
            invalid={error !== null}
          />
          <input type="hidden" name="startDate" value={range.startDate} />
          <input type="hidden" name="endDate" value={range.endDate} />
          {error ? (
            <p id="date-error" role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-semibold">
            Reason
          </label>
          <Textarea
            id="reason"
            name="reason"
            required
            rows={3}
            maxLength={500}
            placeholder="e.g. Family trip to the coast"
          />
          <p className="text-[13px] text-muted-foreground">Only you and admins can see this.</p>
        </div>
        <FormMessage
          state={state}
          successTitle="Request sent"
          successText="An admin will review it soon. You’ll see the answer under My requests."
          successAction={
            <Link href="/vacations" className="font-semibold text-primary-text underline underline-offset-2">
              View my requests
            </Link>
          }
        />
        <div className="flex flex-wrap gap-2.5">
          <SubmitButton blocked={error !== null || !hasRange} />
          <Link href="/dashboard" className={buttonStyles('secondary', 'min-h-12 px-5 text-[15px]')}>
            Cancel
          </Link>
        </div>
      </form>

      <aside
        aria-labelledby="summary-title"
        aria-live="polite"
        className="flex flex-[1_1_300px] flex-col gap-4 rounded-2xl border border-border bg-card p-6"
      >
        <h2 id="summary-title" className="font-display text-[17px] font-semibold">
          Summary
        </h2>
        {hasRange ? (
          <>
            <div>
              <p className="font-display text-[44px] font-bold leading-none">{workingDays}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {workingDays === 1 ? 'working day' : 'working days'}
              </p>
            </div>
            <dl className="grid gap-2.5 rounded-xl bg-muted p-3.5 text-sm">
              <SummaryRow label="Available now" value={plural(availableDays, 'day')} />
              <SummaryRow
                label="This request"
                value={workingDays > 0 ? `−${plural(workingDays, 'day')}` : plural(0, 'day')}
              />
              <div className="border-t border-border pt-2.5">
                <SummaryRow
                  label="Left afterwards"
                  value={plural(leftAfter, 'day')}
                  emphasis={`font-bold ${leftAfter < 0 ? 'text-danger' : 'text-success'}`}
                />
              </div>
            </dl>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Pick your first and last day off to see how many days this uses.
            </p>
            <dl className="grid gap-2.5 rounded-xl bg-muted p-3.5 text-sm">
              <SummaryRow label="Available now" value={plural(availableDays, 'day')} />
            </dl>
          </>
        )}
        {holidaysInRange.length > 0 ? (
          <p className="rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm text-primary-text">
            Includes {holidaysInRange.map((holiday) => holiday.name).join(', ')}, which{' '}
            {holidaysInRange.length === 1 ? 'isn’t' : 'aren’t'} counted.
          </p>
        ) : null}
        <p className="text-[13px] text-muted-foreground">Weekends and public holidays are not counted.</p>
      </aside>
    </div>
  );
}
