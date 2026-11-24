const tints = [
  'bg-primary-soft text-primary-text',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-sick-soft text-sick'
];

function tintFor(seed: string): string {
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  return tints[hash % tints.length];
}

interface AvatarProps {
  firstName: string;
  lastName: string;
  seed: string;
  size?: 'md' | 'lg';
}

export function Avatar({ firstName, lastName, seed, size = 'md' }: AvatarProps) {
  const dimensions = size === 'lg' ? 'h-11 w-11 rounded-[11px] text-sm' : 'h-10 w-10 rounded-[10px] text-[13px]';

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center font-bold ${dimensions} ${tintFor(seed)}`}
    >
      {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
    </span>
  );
}
