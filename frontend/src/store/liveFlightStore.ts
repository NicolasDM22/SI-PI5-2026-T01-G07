import { create } from 'zustand';

export interface LiveFrame {
  index: number;
  path: string;
  ts: string;
}

export interface CompletedLiveFlight {
  id: string;
  serverIp: string;
  startTs: string;
  endTs: string;
  frameCount: number;
  frames: LiveFrame[];
}

interface LiveFlightState {
  // IP da máquina onde o servidor roda (sem porta)
  serverIp: string;
  setServerIp: (ip: string) => void;

  // Voo em andamento
  flightId: string | null;
  flightStatus: 'idle' | 'active' | 'completed';
  frameCount: number;
  startTs: string | null;
  lastFrameBase64: string | null;
  currentFrames: LiveFrame[];

  setFlightStarted: (flightId: string, startTs: string) => void;
  addFrame: (frame: LiveFrame, imageBase64: string) => void;
  setFlightCompleted: (endTs: string, frames: LiveFrame[]) => void;
  resetFlight: () => void;

  // Histórico de voos ao vivo concluídos
  completedFlights: CompletedLiveFlight[];
}

export const useLiveFlightStore = create<LiveFlightState>((set, get) => ({
  serverIp: '',
  setServerIp: (ip) => set({ serverIp: ip }),

  flightId: null,
  flightStatus: 'idle',
  frameCount: 0,
  startTs: null,
  lastFrameBase64: null,
  currentFrames: [],

  completedFlights: [],

  setFlightStarted: (flightId, startTs) =>
    set({
      flightId,
      startTs,
      flightStatus: 'active',
      frameCount: 0,
      lastFrameBase64: null,
      currentFrames: [],
    }),

  addFrame: (frame, imageBase64) =>
    set((state) => ({
      frameCount: frame.index + 1,
      lastFrameBase64: imageBase64,
      currentFrames: [...state.currentFrames, frame],
    })),

  setFlightCompleted: (endTs, frames) => {
    const { flightId, serverIp, startTs, frameCount, currentFrames } = get();
    if (!flightId || !startTs) return;
    const allFrames = frames.length > 0 ? frames : currentFrames;
    set((state) => ({
      flightStatus: 'completed',
      completedFlights: [
        {
          id: flightId,
          serverIp,
          startTs,
          endTs,
          frameCount: allFrames.length || frameCount,
          frames: allFrames,
        },
        ...state.completedFlights,
      ],
    }));
  },

  resetFlight: () =>
    set({
      flightId: null,
      flightStatus: 'idle',
      frameCount: 0,
      startTs: null,
      lastFrameBase64: null,
      currentFrames: [],
    }),
}));
