import { apiClient } from '../client';

export interface SubmitFlightForAiPayload {
  flightId: string;
  source: 'live' | 'upload';
  images?: string[];
  videoUri?: string;
  metadata?: Record<string, unknown>;
}

export async function submitFlightForAi(payload: SubmitFlightForAiPayload): Promise<void> {
  // Endpoint pronto para ativar quando a API de IA subir.
  // Mantemos a chamada desacoplada para facilitar o switch.
  try {
    await apiClient.post('/ai/flights/analyze', payload);
  } catch {
    // Falha é tolerada por enquanto (modo POC/offline).
  }
}
