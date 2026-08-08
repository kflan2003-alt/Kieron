import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase integration point.
 *
 * The prototype does NOT ship connected to a live project — there's no
 * URL or key checked into the repo. Everything the app needs (kitchen,
 * meal plan, shopping list, preferences) is read from and written to the
 * local Zustand stores in src/store/, which persist to AsyncStorage.
 *
 * To connect a real backend later:
 *   1. Create a Supabase project and the tables described in src/types.
 *   2. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a
 *      local .env file (Expo inlines EXPO_PUBLIC_* vars at build time —
 *      see https://docs.expo.dev/guides/environment-variables/).
 *   3. Replace the store actions in src/store/ with calls through
 *      `getSupabaseClient()` (e.g. supabase.from('food_items').select()),
 *      keeping the same store shape so screens don't need to change.
 *
 * isSupabaseConfigured() lets the rest of the app check this without
 * throwing, so the prototype runs identically with or without a project.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

/** Returns null (not a throw) when no project is configured, so callers can fall back to local storage. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  }
  return client;
}
