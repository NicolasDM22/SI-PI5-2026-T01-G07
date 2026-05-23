import { Flight } from '../../types';
import { apiClient } from '../client';
import { useFlightHistoryStore } from '../../store/flightHistoryStore';

const USE_LOCAL_FALLBACK = false;

function withThumbnail(flight: Flight): Flight {
  const baseUrl = (apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
  const hasThumbnail = (flight.frameCount ?? 0) > 0 && flight.status === 'completed';
  return {
    ...flight,
    thumbnailUrl: hasThumbnail ? `${baseUrl}/flights/${flight.id}/frames/frame_001.jpg` : undefined,
  };
}

export async function getFlights(farmId?: string): Promise<Flight[]> {
  if (USE_LOCAL_FALLBACK) {
    const flights = useFlightHistoryStore.getState().flights;
    return farmId ? flights.filter((f) => f.farmId === farmId) : [...flights];
  }

  const { data } = await apiClient.get<Flight[]>('/flights', { params: { farmId } });
  return data.map(withThumbnail);
}

export async function getFlightById(id: string): Promise<Flight> {
  if (USE_LOCAL_FALLBACK) {
    const flight = useFlightHistoryStore.getState().getFlightById(id);
    if (!flight) throw new Error('Voo não encontrado');
    return flight;
  }

  const { data } = await apiClient.get<Flight>(`/flights/${id}`);
  return withThumbnail(data);
}

export interface UploadFlightPayload {
  name?: string;
  pastureId: string;
  pastureName?: string;
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
  if (payload.name) formData.append('name', payload.name);
  formData.append('pastureId', payload.pastureId);
  if (payload.pastureName) formData.append('pastureName', payload.pastureName);
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

export interface FrameInfo {
  name: string;
  index: number;
  url: string;
}

export interface DetectionResult {
  count: number;
  annotatedImageB64: string | null;
}

export async function getFlightFrames(flightId: string): Promise<FrameInfo[]> {
  const { data } = await apiClient.get<{ name: string; index: number }[]>(`/flights/${flightId}/frames`);
  const baseUrl = (apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
  return data.map((f) => ({
    ...f,
    url: `${baseUrl}/flights/${flightId}/frames/${f.name}`,
  }));
}

export async function detectFrameCattle(flightId: string, frameName: string): Promise<DetectionResult> {
  const { data } = await apiClient.post<DetectionResult>(`/flights/${flightId}/frames/${frameName}/detect`);
  return data;
}

export async function analyzeAllFrames(flightId: string): Promise<{ detectedCount: number }> {
  const { data } = await apiClient.post<{ detectedCount: number }>(`/flights/${flightId}/analyze`);
  return data;
}
