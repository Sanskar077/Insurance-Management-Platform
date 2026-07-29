import { describe, expect, it } from 'vitest';
import { formatMonthLabel, formatMoney, formatCompactMoney } from './chartTheme';

describe('formatMonthLabel', () => {
  it('formats a YYYY-MM key to short month + year', () => {
    expect(formatMonthLabel('2026-07')).toMatch(/Jul.*26/);
    expect(formatMonthLabel('2026-01')).toMatch(/Jan.*26/);
    expect(formatMonthLabel('2026-12')).toMatch(/Dec.*26/);
  });
});

describe('formatMoney', () => {
  it('formats whole dollars', () => {
    expect(formatMoney(1234)).toBe('$1,234.00');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(1234567.89)).toBe('$1,234,567.89');
  });
});

describe('formatCompactMoney', () => {
  it('uses millions abbreviation for large values', () => {
    expect(formatCompactMoney(2_500_000)).toBe('$2.5M');
    expect(formatCompactMoney(1_000_000)).toBe('$1M');
  });

  it('uses thousands abbreviation', () => {
    expect(formatCompactMoney(12_000)).toBe('$12K');
    expect(formatCompactMoney(99_500)).toBe('$99.5K');
  });

  it('shows full for moderate values', () => {
    expect(formatCompactMoney(5000)).toBe('$5,000.00');
    expect(formatCompactMoney(9999)).toBe('$9,999.00');
  });
});
