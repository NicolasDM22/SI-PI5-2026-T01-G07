import { Farm, Pasture } from '../../types';
import { apiClient } from '../client';

export async function getMyFarm(): Promise<Farm> {
  const { data } = await apiClient.get<Farm>('/farms/mine');
  return data;
}

export async function getPastures(farmId: string): Promise<Pasture[]> {
  const { data } = await apiClient.get<Pasture[]>(`/farms/${farmId}/pastures`);
  return data;
}

export async function createPasture(
  farmId: string,
  payload: { name: string; expectedCount: number },
): Promise<Pasture> {
  const { data } = await apiClient.post<Pasture>(`/farms/${farmId}/pastures`, {
    name: payload.name,
    expected_count: payload.expectedCount,
  });
  return data;
}

export async function updatePasture(
  farmId: string,
  pastureId: string,
  payload: { name?: string; expectedCount?: number },
): Promise<Pasture> {
  const { data } = await apiClient.put<Pasture>(`/farms/${farmId}/pastures/${pastureId}`, {
    name: payload.name,
    expected_count: payload.expectedCount,
  });
  return data;
}

export async function deletePasture(farmId: string, pastureId: string): Promise<void> {
  await apiClient.delete(`/farms/${farmId}/pastures/${pastureId}`);
}
