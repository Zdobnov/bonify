import { API_BASE_URL } from '../config/api';

type GetUserReliabilityParams = {
  from: string;
  userId: string;
};

export type ReliabilityResponse = {
  user_id: string;
  from: string;
  currency: string;
  reliability_index: number;
  score_band: 'LOW' | 'MEDIUM' | 'HIGH';
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

  return response.json();
};
