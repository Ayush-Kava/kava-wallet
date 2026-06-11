import { apiFetch } from '@/lib/api-client';

export const authApi = {
  updateProfile: async (full_name: string) => {
    return apiFetch<{ user: { full_name: string | null } }>('/api/auth/profile', 'PUT', {
      full_name,
    });
  },
};
