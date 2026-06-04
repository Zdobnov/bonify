import { API_BASE_URL } from '../config/api';

export type ApiDiscoveryResponse = {
  name: string;
  version: string;
  description: string;
  available_users: string[];
  data_range: {
    from: string;
    to: string;
  };
  endpoints: Array<{
    method: string;
    path: string;
    description: string;
  }>;
};

export const getApiDiscovery = async (): Promise<ApiDiscoveryResponse> => {
  const response = await fetch(`${API_BASE_URL}/`);

  if (!response.ok) {
    throw new Error(`Failed to load API discovery: ${response.status}`);
  }

  return response.json();
};
