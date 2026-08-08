import { create } from 'zustand';
import { FoodRecognitionResult } from '../types';

// Deliberately not persisted — a scan session only needs to live for the
// few seconds between capturing photos and confirming the result.
interface ScanSessionState {
  photoUris: string[];
  result: FoodRecognitionResult | null;
  addPhoto: (uri: string) => void;
  setResult: (result: FoodRecognitionResult | null) => void;
  reset: () => void;
}

export const useScanSessionStore = create<ScanSessionState>()((set) => ({
  photoUris: [],
  result: null,
  addPhoto: (uri) => set((state) => ({ photoUris: [...state.photoUris, uri] })),
  setResult: (result) => set({ result }),
  reset: () => set({ photoUris: [], result: null }),
}));
