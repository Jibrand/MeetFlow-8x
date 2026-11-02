import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
export function useRegistrationStatus() {
  return useQuery({
    queryKey: ['auth', 'registration'],
    queryFn: ({ signal }) =>
      apiClient<{ registrationOpen: boolean }>('/auth/status', { signal }),
    staleTime: 0,
    retry: false,
  });
}
