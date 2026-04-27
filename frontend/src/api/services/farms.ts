import { Farm, Pasture } from '../../types';
import { apiClient } from '../client';

const USE_LOCAL_FALLBACK = true;

const localFarm: Farm = {
  id: 'farm-local',
  name: 'Fazenda POC',
  ownerId: 'user-local',
  totalArea: 0,
  totalAnimals: 0,
};

const localPastures: Pasture[] = [
  { id: 'pasture-upload', farmId: 'farm-local', name: 'Pasto Upload', expectedCount: 0 },
  { id: 'pasture-live', farmId: 'farm-local', name: 'Pasto Live', expectedCount: 0 },
];

export async function getMyFarm(): Promise<Farm> {
  if (USE_LOCAL_FALLBACK) {
    return localFarm;
  }

  const { data } = await apiClient.get<Farm>('/farms/mine');
  return data;
}

export async function getPastures(farmId: string): Promise<Pasture[]> {
  if (USE_LOCAL_FALLBACK) {
    return localPastures.filter((p) => p.farmId === farmId);
  }

  const { data } = await apiClient.get<Pasture[]>(`/farms/${farmId}/pastures`);
  return data;
}
