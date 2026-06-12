import { API_BASE_URL } from '../config/api';
import { isValidDateString } from '../utils/date';

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

const normalizeApiDiscovery = (payload: Partial<ApiDiscoveryResponse>): ApiDiscoveryResponse => {
  const dataRange = payload.data_range ?? { from: '', to: '' };

  return {
    available_users: Array.isArray(payload.available_users)
      ? payload.available_users.filter((userId): userId is string => typeof userId === 'string')
      : [],
    data_range: {
      from: isValidDateString(dataRange.from) ? dataRange.from : '',
      to: isValidDateString(dataRange.to) ? dataRange.to : '',
    },
    description: typeof payload.description === 'string' ? payload.description : '',
    endpoints: Array.isArray(payload.endpoints) ? payload.endpoints : [],
    name: typeof payload.name === 'string' ? payload.name : 'Credit Builder API',
    version: typeof payload.version === 'string' ? payload.version : '',
  };
};

export const getApiDiscovery = async (): Promise<ApiDiscoveryResponse> => {
  const response = await fetch(`${API_BASE_URL}/`);

  if (!response.ok) {
    throw new Error(`Failed to load API discovery: ${response.status}`);
  }

  return normalizeApiDiscovery(await response.json());
};
