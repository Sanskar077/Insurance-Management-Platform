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

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  // Required by the API only when role === 'CUSTOMER'.
  fullName?: string;
  dob?: string;
  phone?: string;
  address?: string;
}

export type RegisterResult = LoginResult;

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await apiRequest<ApiEnvelope<LoginResult>>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return result.data;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const result = await apiRequest<ApiEnvelope<RegisterResult>>('/auth/register', {
    method: 'POST',
    body: input,
  });
  return result.data;
}
