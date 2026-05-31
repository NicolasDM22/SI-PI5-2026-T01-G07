export type UserRole = 'manager' | 'vet' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  farmId: string | null;
}

export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  totalArea: number;
  totalAnimals: number;
}

export interface Pasture {
  id: string;
  farmId: string;
  name: string;
  expectedCount: number;
}

export type AlertType = 'anomaly_visual' | 'low_count' | 'behavior_abnormal' | 'isolation';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'pending' | 'investigating' | 'resolved' | 'false_positive';

export interface Alert {
  id: string;
  flightId: string;
  pastureId: string;
  pastureName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  thumbnailUrl: string;
  imageUrl: string;
  detectedAt: string;
  resolvedAt?: string;
  notes?: string;
}

export type FlightStatus = 'completed' | 'processing' | 'failed';
export type FlightSource = 'live' | 'upload';
export type AiSyncStatus = 'pending' | 'sent' | 'failed';

export interface Flight {
  id: string;
  name?: string;
  pastureId: string;
  pastureName?: string;
  farmId?: string;
  operatorId?: string;
  startTs: string;
  endTs?: string;
  altitudeEstimated?: number;
  status: FlightStatus;
  detectedCount?: number;
  expectedCount?: number;
  alertsCount: number;
  notes?: string;
  source?: FlightSource;
  aiSyncStatus?: AiSyncStatus;
  frameCount?: number;
  thumbnailUrl?: string;
}

export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error';

export interface UploadItem {
  id: string;
  localUri: string;
  fileName: string;
  fileSize: number;
  pastureId: string;
  pastureName: string;
  flightDate: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
  createdAt: string;
}
