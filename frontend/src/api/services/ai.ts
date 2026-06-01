import { apiClient } from '../client';

export interface SubmitFlightForAiPayload {
  flightId: string;
  source: 'live' | 'upload';
  images?: string[];
  videoUri?: string;
  metadata?: Record<string, unknown>;
}

export interface ImageDetectResult {
  count: number;
  annotatedImageB64: string | null;
}

export async function submitFlightForAi(payload: SubmitFlightForAiPayload): Promise<void> {
  try {
    await apiClient.post('/ai/flights/analyze', payload);
  } catch {
    // Falha é tolerada por enquanto (modo POC/offline).
  }
}

export async function detectImage(imageUri: string, mimeType?: string): Promise<ImageDetectResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'image.jpg',
    type: mimeType ?? 'image/jpeg',
  } as any);
  const response = await apiClient.post<ImageDetectResult>('/images/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data;
}
