import { VacationRequest } from '@vacation/shared';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { localDateKey, toDateKey } from '@/lib/dates';

export function VacationCalendar({ vacations }: { vacations: VacationRequest[] }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: calendarStart,
    end: addDays(monthEnd, 13)
  }).slice(0, 42);

  const isVacationDay = (day: Date) => {
    const dayKey = localDateKey(day);
    return vacations.some(
      (vacation) => dayKey >= toDateKey(vacation.startDate) && dayKey <= toDateKey(vacation.endDate)
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm font-semibold">{format(monthStart, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
          <div key={dayName} className="py-1 text-muted-foreground">
            {dayName}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`rounded-md px-1 py-2 ${
              isSameMonth(day, monthStart) ? '' : 'text-muted-foreground/40'
            } ${isVacationDay(day) ? 'bg-emerald-200/60 dark:bg-emerald-900/70' : ''}`}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
}
