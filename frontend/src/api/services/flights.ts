import { Flight } from '../../types';
import { apiClient } from '../client';
import { useFlightHistoryStore } from '../../store/flightHistoryStore';

const USE_LOCAL_FALLBACK = false;

export async function getFlights(farmId?: string): Promise<Flight[]> {
  if (USE_LOCAL_FALLBACK) {
    const flights = useFlightHistoryStore.getState().flights;
    return farmId ? flights.filter((f) => f.farmId === farmId) : [...flights];
  }

  const { data } = await apiClient.get<Flight[]>('/flights', { params: { farmId } });
  return data;
}

export async function getFlightById(id: string): Promise<Flight> {
  if (USE_LOCAL_FALLBACK) {
    const flight = useFlightHistoryStore.getState().getFlightById(id);
    if (!flight) throw new Error('Voo não encontrado');
    return flight;
  }

  const { data } = await apiClient.get<Flight>(`/flights/${id}`);
  return data;
}

export interface UploadFlightPayload {
  pastureId: string;
  farmId: string;
  flightDate: string;
  altitudeEstimated?: number;
  notes?: string;
  videoUri: string;
  videoFile?: File;
}

export async function uploadFlight(payload: UploadFlightPayload): Promise<{ flightId: string }> {
  if (USE_LOCAL_FALLBACK) {
    const created = useFlightHistoryStore.getState().registerFlight({
      pastureId: payload.pastureId,
      pastureName: 'Pasto enviado por upload',
      startTs: payload.flightDate,
      endTs: new Date().toISOString(),
      notes: payload.notes,
      source: 'upload',
      altitudeEstimated: payload.altitudeEstimated ?? 35,
    });
    return { flightId: created.id };
  }

  const formData = new FormData();
  formData.append('pastureId', payload.pastureId);
  formData.append('farmId', payload.farmId);
  formData.append('flightDate', payload.flightDate);
  if (payload.altitudeEstimated) formData.append('altitudeEstimated', String(payload.altitudeEstimated));
  if (payload.notes) formData.append('notes', payload.notes);
  if (payload.videoFile) {
    formData.append('video', payload.videoFile, payload.videoFile.name);
  } else {
    formData.append('video', { uri: payload.videoUri, type: 'video/mp4', name: 'flight.mp4' } as any);
  }

  const { data } = await apiClient.post<{ flightId: string }>('/flights/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
