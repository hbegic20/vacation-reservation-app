import { TeamAbsence } from '@vacation/shared';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { formatDateRange } from '@/lib/dates';

interface TeamAbsencesCardProps {
  department: string | null;
  absences: TeamAbsence[];
}

function EmptyMessage({ department }: { department: string | null }) {
  return (
    <p className="text-sm text-muted-foreground">
      {department
        ? 'Everyone on your team is in this week.'
        : 'Ask an admin to set your department to see your team here.'}
    </p>
  );
}

export function TeamAbsencesCard({ department, absences }: TeamAbsencesCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-[17px] font-semibold">
        {department ? `Out in ${department} this week` : 'Your team this week'}
      </h2>
      {absences.length === 0 ? (
        <EmptyMessage department={department} />
      ) : (
        <ul className="flex flex-col gap-3">
          {absences.map((absence) => (
            <li key={absence.id} className="flex items-center gap-3">
              <Avatar
                firstName={absence.person.firstName}
                lastName={absence.person.lastName}
                seed={absence.person.id}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {absence.person.firstName} {absence.person.lastName}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Away {formatDateRange(absence.startDate, absence.endDate)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
