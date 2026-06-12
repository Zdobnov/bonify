import { describe, expect, it } from 'vitest';
import { getScoringWindow } from './date';

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
});
