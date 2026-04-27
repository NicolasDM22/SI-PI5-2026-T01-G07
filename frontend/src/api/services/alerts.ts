import { Alert, AlertStatus } from '../../types';
import { apiClient } from '../client';

const USE_LOCAL_FALLBACK = true;

export interface AlertsFilter {
  status?: AlertStatus;
  pastureId?: string;
  flightId?: string;
}

export async function getAlerts(filter?: AlertsFilter): Promise<Alert[]> {
  if (USE_LOCAL_FALLBACK) {
    void filter;
    return [];
  }

  const { data } = await apiClient.get<Alert[]>('/alerts', { params: filter });
  return data;
}

export async function getAlertById(id: string): Promise<Alert> {
  if (USE_LOCAL_FALLBACK) {
    throw new Error(`Alerta ${id} não encontrado no modo local`);
  }

  const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
  return data;
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
  notes?: string
): Promise<Alert> {
  if (USE_LOCAL_FALLBACK) {
    throw new Error(`Não é possível atualizar alerta ${id} no modo local`);
  }

  const { data } = await apiClient.patch<Alert>(`/alerts/${id}`, { status, notes });
  return data;
}
