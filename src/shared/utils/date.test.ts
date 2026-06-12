import { describe, expect, it } from 'vitest';
import { getMonthsInRange, getScoringWindow, isDateWithinRange } from './date';

describe('getScoringWindow', () => {
  it('returns the OpenAPI example 6-month scoring window', () => {
    expect(getScoringWindow('2026-02-20')).toEqual({
      from: '2025-09-01',
      to: '2026-02-20',
    });
  });

  it('starts at the first day of the earliest scoring month', () => {
    expect(getScoringWindow('2026-06-30')).toEqual({
      from: '2026-01-01',
      to: '2026-06-30',
    });
  });

  it('keeps the provided end date unchanged', () => {
    expect(getScoringWindow('2025-09-01')).toEqual({
      from: '2025-04-01',
      to: '2025-09-01',
    });
  });

  it('returns null for invalid scoring dates', () => {
    expect(getScoringWindow('not-a-date')).toBeNull();
  });

  it('returns no months for invalid or inverted ranges', () => {
    expect(getMonthsInRange('not-a-date', '2026-02-20')).toEqual([]);
    expect(getMonthsInRange('2026-03-01', '2026-02-20')).toEqual([]);
  });

  it('returns false for invalid date range checks', () => {
    expect(isDateWithinRange('not-a-date', '2026-01-01', '2026-02-20')).toBe(false);
    expect(isDateWithinRange('2026-01-15', '2026-03-01', '2026-02-20')).toBe(false);
  });
});
