import type { Metadata } from 'next';
import Link from 'next/link';
import { EmployeeListItem } from '@vacation/shared';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchEmployees } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { fullName, plural } from '@/lib/people';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Employees' };

const lowBalanceThreshold = 5;

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'days-left', label: 'Most days left' },
  { value: 'pending', label: 'Pending requests' }
] as const;

type SortOption = (typeof sortOptions)[number]['value'];

interface AdminEmployeesPageProps {
  searchParams: {
    q?: string;
    department?: string;
    sort?: string;
  };
}

function parseSort(value: string | undefined): SortOption {
  return sortOptions.find((option) => option.value === value)?.value ?? 'name';
}

function daysLeft(employee: EmployeeListItem): number {
  return employee.vacationDaysTotal - employee.vacationDaysUsed;
}

const comparators: Record<SortOption, (a: EmployeeListItem, b: EmployeeListItem) => number> = {
  name: (a, b) => fullName(a).localeCompare(fullName(b)),
  'days-left': (a, b) => daysLeft(b) - daysLeft(a),
  pending: (a, b) => b.pendingRequests - a.pendingRequests
};

function selectEmployees(
  employees: EmployeeListItem[],
  query: string,
  department: string,
  sort: SortOption
): EmployeeListItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return employees
    .filter((employee) => department === '' || employee.department === department)
    .filter(
      (employee) =>
        normalizedQuery === '' ||
        fullName(employee).toLowerCase().includes(normalizedQuery) ||
        employee.email.toLowerCase().includes(normalizedQuery)
    )
    .sort(comparators[sort]);
}

function departmentsOf(employees: EmployeeListItem[]): string[] {
  const departments = employees
    .map((employee) => employee.department)
    .filter((department): department is string => Boolean(department));
  return Array.from(new Set(departments)).sort();
}

function AllowanceBar({ employee }: { employee: EmployeeListItem }) {
  const left = daysLeft(employee);
  const usedShare =
    employee.vacationDaysTotal > 0
      ? Math.min(Math.round((employee.vacationDaysUsed / employee.vacationDaysTotal) * 100), 100)
      : 0;
  const isLow = left <= lowBalanceThreshold;

  return (
    <div>
      <div
        role="img"
        aria-label={`${employee.vacationDaysUsed} of ${employee.vacationDaysTotal} days used`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full', isLow ? 'bg-warning' : 'bg-primary')} style={{ width: `${usedShare}%` }} />
      </div>
      <p className="mt-1.5 text-[13px]">
        <strong>{employee.vacationDaysUsed}</strong> of {employee.vacationDaysTotal} ·{' '}
        <span className={isLow ? 'font-semibold text-warning' : undefined}>{left} left</span>
      </p>
    </div>
  );
}

export default async function AdminEmployeesPage({ searchParams }: AdminEmployeesPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const employees = await fetchEmployees(token);
  const query = searchParams.q ?? '';
  const department = searchParams.department ?? '';
  const sort = parseSort(searchParams.sort);
  const visibleEmployees = selectEmployees(employees, query, department, sort);
  const activeCount = employees.filter((employee) => employee.isActive).length;

  return (
    <PageShell user={user}>
      <PageHeader
        title="Employees"
        description={`${plural(employees.length, 'person', 'people')} · ${activeCount} active`}
        actions={
          <Link href="/admin/employees/new" className={buttonStyles('primary', 'min-h-12 px-5 text-[15px]')}>
            <Icon name="plus" size={18} />
            Add employee
          </Link>
        }
      />

      <form method="get" role="search" className="flex flex-wrap items-center gap-3">
        <div className="relative flex-[1_1_300px]">
          <label htmlFor="employee-search" className="sr-only">
            Search employees
          </label>
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute left-3.5 top-[15px] text-muted-foreground"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <Input
            id="employee-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by name or email"
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="employee-department" className="text-sm font-semibold">
            Department
          </label>
          <Select id="employee-department" name="department" defaultValue={department}>
            <option value="">All</option>
            {departmentsOf(employees).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="employee-sort" className="text-sm font-semibold">
            Sort
          </label>
          <Select id="employee-sort" name="sort" defaultValue={sort}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <button type="submit" className={buttonStyles('secondary', 'min-h-12')}>
          Apply
        </button>
      </form>

      {visibleEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">
            {employees.length === 0 ? 'No employees yet' : 'No matches'}
          </p>
          <p className="mt-1 text-muted-foreground">
            {employees.length === 0
              ? 'Create the first account to get started.'
              : 'Try a different name, email or department.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">Employees and their vacation allowance</caption>
            <thead>
              <tr className="border-b border-border text-left text-[13px] text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  Person
                </th>
                <th scope="col" className="px-3 py-3.5 font-semibold">
                  Department
                </th>
                <th scope="col" className="w-56 px-3 py-3.5 font-semibold">
                  Allowance used
                </th>
                <th scope="col" className="px-3 py-3.5 font-semibold">
                  Pending
                </th>
                <th scope="col" className="px-3 py-3.5 font-semibold">
                  Upcoming
                </th>
                <th scope="col" className="px-5 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={employee.firstName} lastName={employee.lastName} seed={employee.id} />
                      <div>
                        <p className={cn('font-semibold', employee.isActive ? '' : 'text-muted-foreground')}>
                          {fullName(employee)}
                          {employee.isActive ? null : (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                              Inactive
                            </span>
                          )}
                        </p>
                        <p className="text-[13px] text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">{employee.department ?? '—'}</td>
                  <td className="px-3 py-3.5">
                    <AllowanceBar employee={employee} />
                  </td>
                  <td className="px-3 py-3.5">
                    {employee.pendingRequests > 0 ? (
                      <span className="inline-flex rounded-full bg-warning-soft px-2.5 py-0.5 text-[13px] font-semibold text-warning">
                        {employee.pendingRequests} waiting
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    {employee.upcomingApprovedRequests > 0 ? (
                      plural(employee.upcomingApprovedRequests, 'approved request')
                    ) : (
                      <span className="text-muted-foreground">Nothing planned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/employees/${employee.id}/edit`}
                      aria-label={`Edit ${fullName(employee)}`}
                      className={buttonStyles('secondary')}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[13px] text-muted-foreground">
        An amber bar means {lowBalanceThreshold} or fewer days are left.
      </p>
    </PageShell>
  );
}
