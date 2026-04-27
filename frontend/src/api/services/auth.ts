import { User } from '../../types';
import { apiClient } from '../client';

const USE_LOCAL_FALLBACK = true; // Troque para false quando a API estiver pronta

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_LOCAL_FALLBACK) {
    if (payload.email && payload.password) {
      return {
        user: {
          id: 'user-local',
          name: 'Operador Local',
          email: payload.email,
          role: 'operator',
          farmId: 'farm-local',
        },
        token: 'local-session-token',
      };
    }
    throw new Error('Credenciais inválidas');
  }

  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function logout(): Promise<void> {
  if (USE_LOCAL_FALLBACK) {
    return;
  }
  await apiClient.post('/auth/logout');
}
