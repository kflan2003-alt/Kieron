import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Baloo2_600SemiBold, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { usePreferencesStore } from '../src/store/usePreferencesStore';
import { useKitchenStore } from '../src/store/useKitchenStore';
import { useMealPlanStore } from '../src/store/useMealPlanStore';
import { useShoppingStore } from '../src/store/useShoppingStore';
import { initNotificationChannel, scheduleExpiryNotifications } from '../src/notifications/expiryNotifications';
import { color } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Baloo2_700Bold, Baloo2_600SemiBold, Caveat_600SemiBold });
  const onReady = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);
  useEffect(() => {
    onReady();
  }, [onReady]);

  const onboardingComplete = usePreferencesStore((s) => s.preferences.onboardingComplete);
  const preferences = usePreferencesStore((s) => s.preferences);
  const items = useKitchenStore((s) => s.items);
  const ensureWeek = useMealPlanStore((s) => s.ensureWeek);
  const entries = useMealPlanStore((s) => s.entries);
  const syncShoppingFromPlan = useShoppingStore((s) => s.syncFromPlan);

  useEffect(() => {
    initNotificationChannel();
  }, []);

  useEffect(() => {
    if (!onboardingComplete) return;
    ensureWeek(items, preferences);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingComplete, items.length]);

  useEffect(() => {
    syncShoppingFromPlan(entries, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, items]);

  useEffect(() => {
    if (!preferences.autoSuggestReplan && preferences.notifyDaysBefore.length === 0) return;
    scheduleExpiryNotifications(items, preferences).catch(() => {
      // Local notifications are best-effort in the prototype — a denied
      // permission or simulator limitation shouldn't block the app.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, preferences.notifyDaysBefore]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: color.background }, headerShadowVisible: false, headerTintColor: color.ink, headerTitleStyle: { color: color.ink } }}>
        <Stack.Protected guard={!onboardingComplete}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingComplete}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan/index" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="scan/confirm" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="kitchen/add" options={{ title: 'Add Item', presentation: 'modal' }} />
          <Stack.Screen name="kitchen/[id]" options={{ title: 'Item' }} />
          <Stack.Screen name="meal/[id]" options={{ title: 'Meal' }} />
          <Stack.Screen name="shopping" options={{ title: 'Shopping List' }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
