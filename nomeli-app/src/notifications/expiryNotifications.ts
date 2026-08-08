import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FoodItem, UserPreference } from '../types';
import { addDays } from '../utils/expiry';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

const CATEGORY_IDENTIFIER = 'nomeli-expiry';

/**
 * Re-schedules all local expiry notifications from scratch based on the
 * current kitchen and the user's configured timing (in UserPreference.
 * notifyDaysBefore, e.g. [2, 1, 0]). Cheap enough to call any time the
 * kitchen or preferences change — cancels everything nomeli previously
 * scheduled first so nothing duplicates or goes stale.
 */
export async function scheduleExpiryNotifications(
  items: FoodItem[],
  preferences: UserPreference,
): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.categoryIdentifier === CATEGORY_IDENTIFIER)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  for (const item of items) {
    if (!item.expiryDate) continue;

    for (const notifyDaysBefore of preferences.notifyDaysBefore) {
      // Fire on (expiryDate - notifyDaysBefore), at 9am, regardless of
      // how far away that is from today — as long as it's still ahead of us.
      const fireDate = new Date(addDays(item.expiryDate, -notifyDaysBefore));
      fireDate.setHours(9, 0, 0, 0);
      if (fireDate.getTime() <= Date.now()) continue;

      const body =
        notifyDaysBefore === 0
          ? `Your ${item.name.toLowerCase()} expires today 🥑`
          : notifyDaysBefore === 1
            ? `Your ${item.name.toLowerCase()} expires tomorrow. Nomeli's got ideas for it.`
            : `Your ${item.name.toLowerCase()} expires in ${notifyDaysBefore} days.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Nomeli',
          body,
          categoryIdentifier: CATEGORY_IDENTIFIER,
          data: { foodItemId: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate,
          channelId: Platform.OS === 'android' ? 'expiry' : undefined,
        },
      });
    }
  }
}

export async function initNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry', {
      name: 'Food expiry',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
