import { apiRequest } from '@lib/apiClient';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await apiRequest<ApiEnvelope<LoginResult>>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return result.data;
}
