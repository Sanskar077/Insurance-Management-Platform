import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * Chart.js global registration + shared theme so every dashboard chart reads
 * as one system. Series colors are a validated CVD-safe pair (blue/orange);
 * status charts reuse the app's existing status semantics (StatusBadge).
 */
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export const SERIES = {
  primary: '#2a78d6',
  primaryWash: 'rgba(42, 120, 214, 0.1)',
  secondary: '#eb6834',
} as const;

/** Mirrors StatusBadge semantics — status colors are reserved, never "series 4". */
export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#157a5c',
  APPROVED: '#157a5c',
  PAID: '#157a5c',
  EXPIRED: '#b6720b',
  PENDING: '#b6720b',
  SUBMITTED: '#b6720b',
  UNDER_REVIEW: '#ff8811',
  CANCELLED: '#c0324b',
  REJECTED: '#c0324b',
  OVERDUE: '#c0324b',
  RENEWED: '#6b7691',
  CLOSED: '#6b7691',
};

const INK = '#14213d';
const MUTED = '#6b7691';
const GRID = '#dde3ec';
const FONT_BODY = "'Inter', 'Segoe UI', sans-serif";

ChartJS.defaults.font.family = FONT_BODY;
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = MUTED;

export const tooltipDefaults = {
  backgroundColor: INK,
  titleFont: { family: FONT_BODY, size: 12, weight: 600 as const },
  bodyFont: { family: FONT_BODY, size: 12 },
  padding: 10,
  cornerRadius: 6,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 4,
};

export const gridDefaults = {
  color: GRID,
  lineWidth: 1,
};

/** "2026-07" → "Jul 26" for axis labels. */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return `${date.toLocaleString(undefined, { month: 'short' })} ${String(year).slice(2)}`;
}

export function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact form for KPI values: 1284 → "1,284", 1284000 → "$1.28M" via caller. */
export function formatCompactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `$${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  }
  return formatMoney(value);
}
