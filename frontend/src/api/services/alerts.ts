import { Alert } from '../../types';
import { apiClient } from '../client';

export async function getAlerts(): Promise<Alert[]> {
  const { data } = await apiClient.get<Alert[]>('/alerts');
  return data;
}

export async function getAlertById(id: string): Promise<Alert> {
  const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
  return data;
}

export async function getUnseenCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/alerts/unseen-count');
  return data.count;
}

export async function markAlertSeen(id: string): Promise<void> {
  await apiClient.patch(`/alerts/${id}/seen`);
}
