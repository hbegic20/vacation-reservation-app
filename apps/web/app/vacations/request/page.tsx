import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { DateRange } from '@/components/forms/date-range-picker';
import { VacationRequestForm } from '@/components/forms/vacation-request-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { BridgeSuggestions } from '@/components/requests/bridge-suggestions';
import { isActiveAbsence, todayKey } from '@/lib/absences';
import { fetchBridgeSuggestions, fetchHolidays, fetchTeamMembers, fetchVacations } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Request time off' };

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

interface RequestVacationPageProps {
  searchParams: {
    start?: string;
    end?: string;
  };
}

function parseInitialRange(start: string | undefined, end: string | undefined, today: string): DateRange | undefined {
  if (!start || !end || !dateKeyPattern.test(start) || !dateKeyPattern.test(end)) {
    return undefined;
  }
  return start >= today && end >= start ? { startDate: start, endDate: end } : undefined;
}

export default async function RequestVacationPage({ searchParams }: RequestVacationPageProps) {
  const user = await requireUser();
  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  const token = requireToken();
  const today = todayKey();
  const currentYear = Number(today.slice(0, 4));
  const [holidaysThisYear, holidaysNextYear, ownRequests, teamMembers, suggestions] = await Promise.all([
    fetchHolidays(token, currentYear),
    fetchHolidays(token, currentYear + 1),
    fetchVacations(token),
    fetchTeamMembers(token),
    fetchBridgeSuggestions(token)
  ]);
  const holidays = [...holidaysThisYear, ...holidaysNextYear];
  const activeRequests = ownRequests.filter((request) => isActiveAbsence(request.status));
  const initialRange = parseInitialRange(searchParams.start, searchParams.end, today);

  return (
    <PageShell user={user} width="medium">
      <PageHeader
        title="Request time off"
        description="Admins get a notification as soon as you send this."
        back={{ href: '/dashboard', label: 'Back to dashboard' }}
      />
      <VacationRequestForm
        key={initialRange ? `${initialRange.startDate}-${initialRange.endDate}` : 'empty'}
        availableDays={user.vacationDaysTotal - user.vacationDaysUsed}
        holidays={holidays}
        existingRequests={activeRequests}
        teamMembers={teamMembers}
        initialRange={initialRange}
      />
      {initialRange ? null : <BridgeSuggestions suggestions={suggestions} />}
    </PageShell>
  );
}
