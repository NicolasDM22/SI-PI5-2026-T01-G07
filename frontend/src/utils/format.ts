import { AlertSeverity, AlertStatus, AlertType } from '../types';

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} às ${formatTime(iso)}`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(startIso: string, endIso?: string | null): string {
  if (!endIso) return '—';
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diff <= 0) return '—';
  const totalSeconds = Math.floor(diff / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export const alertTypeLabel: Record<AlertType, string> = {
  anomaly_visual: 'Anomalia Visual',
  low_count: 'Contagem Baixa',
  behavior_abnormal: 'Comportamento Atípico',
  isolation: 'Animal Isolado',
};

export const alertStatusLabel: Record<AlertStatus, string> = {
  pending: 'Pendente',
  investigating: 'Em Investigação',
  resolved: 'Resolvido',
  false_positive: 'Falso Positivo',
};

export const alertSeverityLabel: Record<AlertSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informativo',
};
