import { API_BASE_URL } from '../config/api';
import { isValidDateString } from '../utils/date';

type GetUserReliabilityParams = {
  from: string;
  userId: string;
};

export type ReliabilityResponse = {
  user_id: string;
  from: string;
  currency: string;
  reliability_index: number;
  score_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  metrics: {
    income_regularity: number;
    income_coverage_ratio: number;
    essential_payments_consistency: number;
    good_months: number;
    negative_balance_days: number;
    late_fee_events: number;
  };
  drivers: string[];
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const normalizeScoreBand = (value: unknown): ReliabilityResponse['score_band'] => {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' ? value : 'UNKNOWN';
};

const normalizeReliability = (payload: Partial<ReliabilityResponse>): ReliabilityResponse => {
  const metrics = payload.metrics ?? {
    essential_payments_consistency: 0,
    good_months: 0,
    income_coverage_ratio: 0,
    income_regularity: 0,
    late_fee_events: 0,
    negative_balance_days: 0,
  };

  return {
    currency: typeof payload.currency === 'string' ? payload.currency : 'EUR',
    drivers: Array.isArray(payload.drivers)
      ? payload.drivers.filter((driver): driver is string => typeof driver === 'string')
      : [],
    from: payload.from && isValidDateString(payload.from) ? payload.from : '',
    metrics: {
      essential_payments_consistency: normalizeNumber(metrics.essential_payments_consistency),
      good_months: normalizeNumber(metrics.good_months),
      income_coverage_ratio: normalizeNumber(metrics.income_coverage_ratio),
      income_regularity: normalizeNumber(metrics.income_regularity),
      late_fee_events: normalizeNumber(metrics.late_fee_events),
      negative_balance_days: normalizeNumber(metrics.negative_balance_days),
    },
    reliability_index: normalizeNumber(payload.reliability_index),
    score_band: normalizeScoreBand(payload.score_band),
    user_id: typeof payload.user_id === 'string' ? payload.user_id : '',
  };
};

export const getUserReliability = async ({
  from,
  userId,
}: GetUserReliabilityParams): Promise<ReliabilityResponse> => {
  const searchParams = new URLSearchParams({ from });
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/reliability?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load reliability: ${response.status}`);
  }

  return normalizeReliability(await response.json());
};
