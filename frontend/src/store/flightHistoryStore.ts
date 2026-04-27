import { create } from 'zustand';
import { Flight, FlightSource } from '../types';

interface RegisterFlightInput {
  pastureId: string;
  pastureName: string;
  farmId?: string;
  operatorId?: string;
  startTs: string;
  endTs: string;
  altitudeEstimated?: number;
  detectedCount?: number;
  expectedCount?: number;
  alertsCount?: number;
  notes?: string;
  source: FlightSource;
  frameCount?: number;
}

interface FlightHistoryState {
  flights: Flight[];
  registerFlight: (input: RegisterFlightInput) => Flight;
  getFlightById: (id: string) => Flight | undefined;
}

export const useFlightHistoryStore = create<FlightHistoryState>((set, get) => ({
  flights: [],

  registerFlight: (input) => {
    const flight: Flight = {
      id: `flight-${Date.now()}`,
      pastureId: input.pastureId,
      pastureName: input.pastureName,
      farmId: input.farmId ?? 'farm-local',
      operatorId: input.operatorId ?? 'operator-local',
      startTs: input.startTs,
      endTs: input.endTs,
      altitudeEstimated: input.altitudeEstimated ?? 35,
      status: 'completed',
      detectedCount: input.detectedCount ?? 0,
      expectedCount: input.expectedCount ?? 0,
      alertsCount: input.alertsCount ?? 0,
      notes: input.notes,
      source: input.source,
      aiSyncStatus: 'pending',
      frameCount: input.frameCount ?? 0,
    };

    set((state) => ({
      flights: [flight, ...state.flights].sort(
        (a, b) => new Date(b.endTs).getTime() - new Date(a.endTs).getTime()
      ),
    }));
    return flight;
  },

  getFlightById: (id) => get().flights.find((f) => f.id === id),
}));
