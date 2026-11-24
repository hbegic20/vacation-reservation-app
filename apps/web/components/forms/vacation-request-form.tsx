'use client';

import Link from 'next/link';
import { PublicHoliday, VacationRequest } from '@vacation/shared';
import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createVacationAction } from '@/app/actions';
import { overlapsRange } from '@/lib/absences';
import { countWorkingDays, formatDateRange, localDateKey, toDateKey } from '@/lib/dates';
import { plural } from '@/lib/people';
import { Button, buttonStyles } from '../ui/button';
import { FormMessage } from '../ui/form-message';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState = { success: false, error: null as string | null };
const emptyRange = { startDate: '', endDate: '' };

type DateRange = typeof emptyRange;

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
  const holidayKeys = useMemo(() => new Set(holidays.map((holiday) => toDateKey(holiday.date))), [holidays]);
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDate" className="text-sm font-semibold">
              First day off
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              min={today}
              onChange={(event) => setRange({ ...range, startDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="endDate" className="text-sm font-semibold">
              Last day off
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              required
              min={range.startDate || today}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'date-error' : undefined}
              className={error ? 'border-2 border-danger' : undefined}
              onChange={(event) => setRange({ ...range, endDate: event.target.value })}
            />
          </div>
        </div>
        {error ? (
          <p id="date-error" role="alert" className="-mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-semibold">
            Reason
          </label>
          <Textarea id="reason" name="reason" required rows={4} maxLength={500} />
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
          <SubmitButton blocked={error !== null} />
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
