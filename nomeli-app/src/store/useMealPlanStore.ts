import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayStatus, FoodItem, MealPlanEntry, ReplanProposal, UserPreference } from '../types';
import { getMealGenerationService } from '../services/mealGenerationService';
import { getMealReplanningService } from '../services/mealReplanningService';
import { addDays, todayISO } from '../utils/expiry';

function mondayOf(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

interface MealPlanState {
  weekStart: string;
  entries: MealPlanEntry[];
  pendingProposal: ReplanProposal | null;

  ensureWeek: (kitchen: FoodItem[], preferences: UserPreference) => void;
  regenerateWeek: (kitchen: FoodItem[], preferences: UserPreference) => void;
  setDayStatus: (date: string, status: DayStatus) => void;
  setDayRecipe: (date: string, recipeId: string | null, reason?: string) => void;
  markCooked: (date: string) => void;
  removeMeal: (date: string) => void;

  checkForReplan: (newItem: FoodItem, kitchen: FoodItem[], preferences: UserPreference) => void;
  acceptProposal: () => void;
  dismissProposal: () => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      weekStart: mondayOf(todayISO()),
      entries: [],
      pendingProposal: null,

      ensureWeek: (kitchen, preferences) => {
        const state = get();
        const thisWeek = mondayOf(todayISO());
        if (state.weekStart === thisWeek && state.entries.length === 7) return;

        const entries = getMealGenerationService().generateWeekPlan({
          weekStart: thisWeek,
          kitchen,
          preferences,
          existingEntries: state.weekStart === thisWeek ? state.entries : [],
        });
        set({ weekStart: thisWeek, entries });
      },

      regenerateWeek: (kitchen, preferences) => {
        const state = get();
        const entries = getMealGenerationService().generateWeekPlan({
          weekStart: state.weekStart,
          kitchen,
          preferences,
          existingEntries: state.entries.filter((e) => e.status !== 'cooking'),
        });
        set({ entries });
      },

      setDayStatus: (date, status) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.date === date
              ? { ...e, status, recipeId: status === 'cooking' ? e.recipeId : null, reason: undefined }
              : e,
          ),
        })),

      setDayRecipe: (date, recipeId, reason) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.date === date ? { ...e, recipeId, status: 'cooking', reason, cooked: false } : e,
          ),
        })),

      markCooked: (date) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.date === date ? { ...e, cooked: true } : e)),
        })),

      removeMeal: (date) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.date === date ? { ...e, recipeId: null, reason: undefined, cooked: false } : e,
          ),
        })),

      checkForReplan: (newItem, kitchen, preferences) => {
        if (!preferences.autoSuggestReplan) return;
        const state = get();
        const proposal = getMealReplanningService().proposeReplan({
          newItem,
          kitchen,
          plan: state.entries,
          preferences,
        });
        if (proposal) set({ pendingProposal: proposal });
      },

      acceptProposal: () => {
        const state = get();
        const proposal = state.pendingProposal;
        if (!proposal) return;
        set({
          entries: state.entries.map((e) => {
            const change = proposal.changes.find((c) => c.date === e.date);
            if (!change) return e;
            return { ...e, recipeId: change.toRecipeId, reason: undefined, cooked: false };
          }),
          pendingProposal: null,
        });
      },

      dismissProposal: () => set({ pendingProposal: null }),
    }),
    {
      name: 'nomeli-mealplan',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
