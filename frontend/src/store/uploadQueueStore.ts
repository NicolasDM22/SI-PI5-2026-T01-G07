import { create } from 'zustand';
import { UploadItem, UploadStatus } from '../types';

interface UploadQueueState {
  queue: UploadItem[];
  addToQueue: (item: Omit<UploadItem, 'id' | 'status' | 'progress' | 'createdAt'>) => UploadItem;
  updateStatus: (id: string, status: UploadStatus, progress?: number, errorMessage?: string) => void;
  removeFromQueue: (id: string) => void;
  pendingCount: () => number;
}

export const useUploadQueueStore = create<UploadQueueState>((set, get) => ({
  queue: [],

  addToQueue: (item) => {
    const createdItem: UploadItem = {
      ...item,
      id: `upload-${Date.now()}`,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      queue: [...state.queue, createdItem],
    }));
    return createdItem;
  },

  updateStatus: (id, status, progress, errorMessage) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id
          ? { ...item, status, progress: progress ?? item.progress, errorMessage }
          : item
      ),
    })),

  removeFromQueue: (id) =>
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) })),

  pendingCount: () =>
    get().queue.filter((item) => item.status === 'queued' || item.status === 'error').length,
}));
