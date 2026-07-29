import { apiRequest } from '@lib/apiClient';
import type { GlobalSearchResults } from '@app-types/search.types';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export async function globalSearch(q: string, limit = 5): Promise<GlobalSearchResults> {
  const result = await apiRequest<ApiEnvelope<GlobalSearchResults>>('/search', {
    query: { q, limit },
  });
  return result.data;
}
