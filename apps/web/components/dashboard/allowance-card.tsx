import { Card } from '@/components/ui/card';

const ringRadius = 52;
const ringCircumference = 2 * Math.PI * ringRadius;

interface AllowanceCardProps {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

function AllowanceRing({ remainingDays, totalDays }: { remainingDays: number; totalDays: number }) {
  const remainingShare = totalDays > 0 ? Math.min(Math.max(remainingDays / totalDays, 0), 1) : 0;

  return (
    <svg
      role="img"
      aria-label={`${remainingDays} of ${totalDays} days left`}
      width="124"
      height="124"
      viewBox="0 0 124 124"
      className="shrink-0"
    >
      <circle cx="62" cy="62" r={ringRadius} fill="none" strokeWidth="12" className="stroke-muted" />
      <circle
        cx="62"
        cy="62"
        r={ringRadius}
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={ringCircumference}
        strokeDashoffset={ringCircumference * (1 - remainingShare)}
        transform="rotate(-90 62 62)"
        className="stroke-primary"
      />
      <text x="62" y="62" textAnchor="middle" className="fill-foreground font-display text-[32px] font-bold">
        {remainingDays}
      </text>
      <text x="62" y="84" textAnchor="middle" className="fill-muted-foreground text-xs">
        of {totalDays} days
      </text>
    </svg>
  );
}

function AllowanceRow({ label, value, swatchClassName }: { label: string; value: number; swatchClassName: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-[3px] ${swatchClassName}`} />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto pl-4 font-semibold">{value}</dd>
    </div>
  );
}

export function AllowanceCard({ totalDays, usedDays, remainingDays, pendingDays }: AllowanceCardProps) {
  const freeToBook = Math.max(remainingDays - pendingDays, 0);

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-display text-[17px] font-semibold">Your allowance</h2>
      <div className="flex flex-wrap items-center gap-6">
        <AllowanceRing remainingDays={remainingDays} totalDays={totalDays} />
        <dl className="grid flex-1 gap-2.5 text-sm">
          <AllowanceRow label="Free to book" value={freeToBook} swatchClassName="bg-primary" />
          <AllowanceRow
            label="Awaiting approval"
            value={pendingDays}
            swatchClassName="border-2 border-warning"
          />
          <AllowanceRow label="Used" value={usedDays} swatchClassName="bg-muted-foreground" />
        </dl>
      </div>
    </Card>
  );
}
