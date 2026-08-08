import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreference } from '../types';

const DEFAULT_PREFERENCES: UserPreference = {
  userId: 'local-user',
  name: '',
  peopleCount: 2,
  dietaryPreferences: [],
  allergies: [],
  dislikedFoods: [],
  favouriteCuisines: [],
  cookingConfidence: 'confident',
  preferredCookingTime: 'no_preference',
  autoSuggestReplan: true,
  notifyDaysBefore: [1, 0],
  onboardingComplete: false,
};

interface PreferencesState {
  preferences: UserPreference;
  setPreferences: (patch: Partial<UserPreference>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      setPreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),
      completeOnboarding: () =>
        set((state) => ({ preferences: { ...state.preferences, onboardingComplete: true } })),
      resetOnboarding: () =>
        set(() => ({ preferences: { ...DEFAULT_PREFERENCES } })),
    }),
    {
      name: 'nomeli-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
