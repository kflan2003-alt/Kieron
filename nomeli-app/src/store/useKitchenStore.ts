import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, FoodRecognitionResultItem } from '../types';
import { generateId } from '../utils/id';
import { todayISO } from '../utils/expiry';

interface KitchenState {
  items: FoodItem[];
  addItem: (item: Omit<FoodItem, 'id' | 'userId' | 'dateAdded'>) => FoodItem;
  addFromRecognition: (results: FoodRecognitionResultItem[]) => FoodItem[];
  updateItem: (id: string, patch: Partial<FoodItem>) => void;
  removeItem: (id: string) => void;
  markUsed: (id: string) => void;
  getById: (id: string) => FoodItem | undefined;
}

export const useKitchenStore = create<KitchenState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: FoodItem = {
          ...item,
          id: generateId('food'),
          userId: 'local-user',
          dateAdded: todayISO(),
        };
        set((state) => ({ items: [newItem, ...state.items] }));
        return newItem;
      },

      addFromRecognition: (results) => {
        const newItems: FoodItem[] = results.map((r) => ({
          id: generateId('food'),
          userId: 'local-user',
          name: r.name,
          quantity: r.quantity,
          unit: r.unit,
          category: r.category,
          expiryDate: r.expiryDate,
          expiryType: r.expiryType,
          opened: false,
          dateAdded: todayISO(),
          imageUrl: null,
          recognitionConfidence: r.confidence >= 0.75 ? 'high' : r.confidence >= 0.5 ? 'medium' : 'low',
          needsCheck: Boolean(r.uncertainField),
          needsCheckReason: r.uncertainNote,
        }));
        set((state) => ({ items: [...newItems, ...state.items] }));
        return newItems;
      },

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      markUsed: (id) =>
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id !== id) return item;
              if (item.quantity > 1) return { ...item, quantity: item.quantity - 1 };
              return null;
            })
            .filter((item): item is FoodItem => item !== null),
        })),

      getById: (id) => get().items.find((item) => item.id === id),
    }),
    {
      name: 'nomeli-kitchen',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
