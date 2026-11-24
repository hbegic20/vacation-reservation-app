import Link from 'next/link';
import { BridgeSuggestion } from '@vacation/shared';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatDateRange, formatWeekdayDate } from '@/lib/dates';
import { plural } from '@/lib/people';

function leaveLabel(suggestion: BridgeSuggestion): string {
  return suggestion.leaveStart === suggestion.leaveEnd
    ? formatWeekdayDate(suggestion.leaveStart)
    : formatDateRange(suggestion.leaveStart, suggestion.leaveEnd);
}

export function requestHref(startDate: string, endDate: string): string {
  return `/vacations/request?start=${startDate}&end=${endDate}`;
}

export function BridgeSuggestions({ suggestions }: { suggestions: BridgeSuggestion[] }) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="bridge-title" className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-text">
          <Icon name="sparkles" size={20} />
        </span>
        <div>
          <h2 id="bridge-title" className="font-display text-[17px] font-semibold">
            Make the most of public holidays
          </h2>
          <p className="text-sm text-muted-foreground">Bridge the gap between a holiday and the weekend.</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.leaveStart}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4"
          >
            <div>
              <p className="font-display text-lg font-bold leading-snug">
                Take {plural(suggestion.leaveDays, 'day')}, get {suggestion.daysOff} days off
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.holidays.join(', ')}</p>
            </div>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Request</dt>
                <dd className="text-right font-semibold">{leaveLabel(suggestion)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">You’re off</dt>
                <dd className="text-right">{formatDateRange(suggestion.offStart, suggestion.offEnd)}</dd>
              </div>
            </dl>
            <Link
              href={requestHref(suggestion.leaveStart, suggestion.leaveEnd)}
              className={buttonStyles('secondary', 'mt-auto w-full')}
              aria-label={`Plan time off ${leaveLabel(suggestion)} for ${suggestion.daysOff} days off`}
            >
              Plan this
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
