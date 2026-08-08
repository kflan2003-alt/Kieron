import { View, Text, StyleSheet } from 'react-native';
import { getExpiryUrgency, formatExpiryLabel, ExpiryUrgency } from '../utils/expiry';
import { color, radius, type } from '../theme/tokens';

const STYLES: Record<ExpiryUrgency, { bg: string; fg: string }> = {
  expired: { bg: color.urgentTodaySoft, fg: color.urgentToday },
  today: { bg: color.urgentTodaySoft, fg: color.urgentToday },
  tomorrow: { bg: color.urgentTomorrowSoft, fg: color.urgentTomorrow },
  within3: { bg: color.urgentSoonSoft, fg: color.urgentSoon },
  within7: { bg: color.neutralLaterSoft, fg: color.neutralLater },
  longlife: { bg: color.neutralLaterSoft, fg: color.neutralLater },
};

export function UrgencyBadge({ expiryDate }: { expiryDate: string | null }) {
  const urgency = getExpiryUrgency(expiryDate);
  const { bg, fg } = STYLES[urgency];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{formatExpiryLabel(expiryDate)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { ...type.caption },
});
