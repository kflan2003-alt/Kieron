import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, MealPlanEntry, ShoppingListItem } from '../types';
import { RECIPES } from '../services/mockData';
import { generateId } from '../utils/id';

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

interface ShoppingState {
  items: ShoppingListItem[];
  addManual: (name: string, quantity?: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  syncFromPlan: (entries: MealPlanEntry[], kitchen: FoodItem[]) => void;
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      items: [],

      addManual: (name, quantity) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          items: [
            ...state.items,
            { id: generateId('shop'), name: trimmed, quantity, source: 'manual', checked: false },
          ],
        }));
      },

      toggle: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),

      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      /**
       * Rebuilds the "from recipes" portion of the list from the current
       * plan, skipping anything already sufficiently owned. Manual items
       * and their checked state are preserved.
       */
      syncFromPlan: (entries, kitchen) => {
        const manual = get().items.filter((i) => i.source === 'manual');
        const previousRecipeItems = get().items.filter((i) => i.source === 'recipe');
        const checkedByKey = new Map(previousRecipeItems.map((i) => [`${i.recipeId}:${normalise(i.name)}`, i.checked]));

        const needed = new Map<string, ShoppingListItem>();

        for (const entry of entries) {
          if (!entry.recipeId) continue;
          const recipe = RECIPES.find((r) => r.id === entry.recipeId);
          if (!recipe) continue;

          for (const ing of recipe.ingredients) {
            const owned = kitchen.find((f) => normalise(f.name) === normalise(ing.name));
            // Nomeli avoids re-buying something already owned in enough quantity.
            if (owned && owned.quantity >= ing.quantity) continue;

            const key = `${normalise(ing.name)}`;
            if (needed.has(key)) continue;
            const checkedKey = `${entry.recipeId}:${normalise(ing.name)}`;
            needed.set(key, {
              id: generateId('shop'),
              name: ing.name,
              quantity: `${ing.quantity}${ing.unit === 'unit' ? '' : ing.unit}`,
              source: 'recipe',
              recipeId: entry.recipeId,
              checked: checkedByKey.get(checkedKey) ?? false,
            });
          }
        }

        set({ items: [...Array.from(needed.values()), ...manual] });
      },
    }),
    {
      name: 'nomeli-shopping',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
