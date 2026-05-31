import { User } from '../../types';
import { apiClient } from '../client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  farmName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    farm_name: payload.farmName,
  });
  return data;
}

export async function logout(): Promise<void> {
  return;
}
