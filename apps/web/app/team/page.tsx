import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TeamAbsence, VacationRequest } from '@vacation/shared';
import { CalendarEntry, kindOf, kindStyles } from '@/components/calendar/calendar-day';
import { MonthView } from '@/components/calendar/month-view';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { isActiveAbsence, overlapsRange, todayKey } from '@/lib/absences';
import { fetchHolidays, fetchTeamAbsences, fetchVacations } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';
import {
  MonthRef,
  addDays,
  addMonths,
  monthCells,
  monthOf,
  monthQuery,
  monthYearLabel,
  parseMonthQuery
} from '@/lib/calendar';
import { toDateKey } from '@/lib/dates';

export const metadata: Metadata = { title: 'Team calendar' };

interface TeamPageProps {
  searchParams: {
    month?: string;
  };
}

function monthBounds(month: MonthRef): { first: string; last: string } {
  const keys = monthCells(month).flatMap((cell) => (cell ? [cell.key] : []));
  return { first: keys[0], last: keys[keys.length - 1] };
}

function addEntry(entries: Map<string, CalendarEntry[]>, key: string, entry: CalendarEntry) {
  entries.set(key, [...(entries.get(key) ?? []), entry]);
}

function buildEntries(
  ownRequests: VacationRequest[],
  teamAbsences: TeamAbsence[],
  bounds: { first: string; last: string }
): Map<string, CalendarEntry[]> {
  const entries = new Map<string, CalendarEntry[]>();
  const clip = (start: string, end: string) => ({
    from: start < bounds.first ? bounds.first : start,
    to: end > bounds.last ? bounds.last : end
  });

  for (const request of ownRequests) {
    if (!isActiveAbsence(request.status) || !overlapsRange(request, bounds.first, bounds.last)) {
      continue;
    }
    const kind = kindOf(request);
    const { from, to } = clip(toDateKey(request.startDate), toDateKey(request.endDate));
    for (let key = from; key <= to; key = addDays(key, 1)) {
      addEntry(entries, key, { id: request.id, label: 'You', description: `You (${kindStyles[kind].label})`, kind });
    }
  }

  for (const absence of teamAbsences) {
    const { firstName, lastName } = absence.person;
    const { from, to } = clip(toDateKey(absence.startDate), toDateKey(absence.endDate));
    for (let key = from; key <= to; key = addDays(key, 1)) {
      addEntry(entries, key, {
        id: absence.id,
        label: `${firstName} ${lastName.charAt(0)}.`,
        description: `${firstName} ${lastName} (away)`,
        kind: 'away'
      });
    }
  }

  return entries;
}

function LegendItem({ swatchClassName, label }: { swatchClassName: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-3.5 w-3.5 rounded ${swatchClassName}`} />
      {label}
    </li>
  );
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const user = await requireUser();
  if (user.role === 'ADMIN') {
    redirect('/admin/calendar');
  }

  const token = requireToken();
  const today = todayKey();
  const month = parseMonthQuery(searchParams.month) ?? monthOf(today);
  const bounds = monthBounds(month);
  const [teamAbsences, ownRequests, holidays] = await Promise.all([
    fetchTeamAbsences(token, bounds.first, bounds.last),
    fetchVacations(token),
    fetchHolidays(token, month.year)
  ]);
  const entries = buildEntries(ownRequests, teamAbsences, bounds);
  const holidayNames = new Map(holidays.map((holiday) => [toDateKey(holiday.date), holiday.name]));
  const isCurrentMonth = monthQuery(month) === monthQuery(monthOf(today));
  const teammatesAway = new Set(teamAbsences.map((absence) => absence.person.id)).size;

  return (
    <PageShell user={user} width="full">
      <PageHeader
        title="Team calendar"
        description={
          user.department
            ? `Who in ${user.department} is away, so you can plan around each other.`
            : 'Ask an admin to set your department to see your team here.'
        }
        actions={
          <Link href="/vacations/request" className={buttonStyles('primary')}>
            <Icon name="plus" size={18} />
            Request time off
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <nav aria-label="Change month" className="flex items-center gap-1">
          <Link
            href={`/team?month=${monthQuery(addMonths(month, -1))}`}
            aria-label="Previous month"
            className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="chevronLeft" size={20} />
          </Link>
          <h2 className="min-w-44 text-center font-display text-xl font-bold">{monthYearLabel(month)}</h2>
          <Link
            href={`/team?month=${monthQuery(addMonths(month, 1))}`}
            aria-label="Next month"
            className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="chevronRight" size={20} />
          </Link>
          {isCurrentMonth ? null : (
            <Link href="/team" className={buttonStyles('secondary', 'ml-2')}>
              Today
            </Link>
          )}
        </nav>
        <p className="text-sm text-muted-foreground">
          {teammatesAway === 0
            ? 'No teammates away this month.'
            : `${teammatesAway} ${teammatesAway === 1 ? 'teammate' : 'teammates'} away this month`}
        </p>
        <ul aria-label="Legend" className="flex w-full flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3 text-[13px] text-muted-foreground">
          <LegendItem swatchClassName={kindStyles.away.pill} label="Teammate away" />
          <LegendItem swatchClassName={kindStyles.vacation.pill} label="Your vacation" />
          <LegendItem swatchClassName={kindStyles.pending.pill} label="Your pending request" />
          <LegendItem swatchClassName="ring-1 ring-inset ring-sick/50" label="Public holiday" />
        </ul>
      </div>

      <MonthView month={month} entries={entries} holidayNames={holidayNames} today={today} />
    </PageShell>
  );
}
