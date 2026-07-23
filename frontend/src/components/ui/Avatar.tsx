const PALETTE = ['#14213D', '#FF8811', '#157A5C', '#34478A', '#B6720B', '#C0324B'] as const;

function hashToIndex(input: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

interface AvatarProps {
  fullName: string;
  size?: 'sm' | 'md';
}

export function Avatar({ fullName, size = 'md' }: AvatarProps) {
  const color = PALETTE[hashToIndex(fullName, PALETTE.length)];
  const dimension = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-[var(--font-display)] font-semibold text-white ${dimension}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {getInitials(fullName)}
    </span>
  );
}
