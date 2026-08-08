import { View, Text, StyleSheet, TextInput, Pressable, Switch } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Avocado } from '../../src/components/Avocado';
import { usePreferencesStore } from '../../src/store/usePreferencesStore';
import { color, radius, spacing, type } from '../../src/theme/tokens';

const NOTIFY_OPTIONS = [
  { days: 2, label: '2 days before' },
  { days: 1, label: 'The day before' },
  { days: 0, label: 'On the day' },
];

export default function ProfileScreen() {
  const preferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const resetOnboarding = usePreferencesStore((s) => s.resetOnboarding);

  const toggleNotifyDay = (days: number) => {
    const has = preferences.notifyDaysBefore.includes(days);
    setPreferences({
      notifyDaysBefore: has
        ? preferences.notifyDaysBefore.filter((d) => d !== days)
        : [...preferences.notifyDaysBefore, days].sort((a, b) => b - a),
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Avocado size={56} />
        <Text style={styles.name}>{preferences.name || 'You'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Personal details</Text>
      <Card style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={preferences.name} onChangeText={(v) => setPreferences({ name: v })} placeholder="Your name" placeholderTextColor={color.inkFaint} />
        <Text style={styles.label}>People you usually cook for</Text>
        <TextInput
          style={styles.input}
          value={String(preferences.peopleCount)}
          onChangeText={(v) => setPreferences({ peopleCount: Number(v.replace(/[^0-9]/g, '')) || 1 })}
          keyboardType="number-pad"
        />
      </Card>

      <Text style={styles.sectionTitle}>Food preferences</Text>
      <Card style={styles.card}>
        <PrefRow label="Dietary preferences" value={preferences.dietaryPreferences} />
        <PrefRow label="Allergies" value={preferences.allergies} />
        <PrefRow label="Dislikes" value={preferences.dislikedFoods} />
        <PrefRow label="Favourite cuisines" value={preferences.favouriteCuisines} />
      </Card>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <Card style={styles.card}>
        <Text style={styles.label}>Remind me before food expires</Text>
        {NOTIFY_OPTIONS.map((opt) => (
          <Pressable key={opt.days} onPress={() => toggleNotifyDay(opt.days)} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{opt.label}</Text>
            <Switch
              value={preferences.notifyDaysBefore.includes(opt.days)}
              onValueChange={() => toggleNotifyDay(opt.days)}
              trackColor={{ true: color.sage, false: color.line }}
            />
          </Pressable>
        ))}
        <Pressable onPress={() => setPreferences({ autoSuggestReplan: !preferences.autoSuggestReplan })} style={[styles.toggleRow, styles.toggleRowLast]}>
          <Text style={styles.toggleLabel}>Let Nomeli automatically suggest meal-plan changes</Text>
          <Switch
            value={preferences.autoSuggestReplan}
            onValueChange={(v) => setPreferences({ autoSuggestReplan: v })}
            trackColor={{ true: color.sage, false: color.line }}
          />
        </Pressable>
      </Card>

      <Pressable onPress={resetOnboarding} style={styles.resetLink}>
        <Text style={styles.resetLinkLabel}>Restart onboarding</Text>
      </Pressable>
    </Screen>
  );
}

function PrefRow({ label, value }: { label: string; value: string[] }) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.prefValue}>{value.length ? value.join(', ') : 'None set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  name: { ...type.h1, color: color.ink },
  sectionTitle: { ...type.h2, color: color.ink, marginBottom: spacing.sm },
  card: { marginBottom: spacing.xl, gap: spacing.md },
  label: { ...type.small, color: color.inkDim, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: color.ink,
    marginTop: -spacing.xs,
  },
  prefRow: { gap: 2 },
  prefValue: { ...type.body, color: color.ink },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  toggleRowLast: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: spacing.md, marginTop: spacing.xs },
  toggleLabel: { ...type.body, color: color.ink, flex: 1, marginRight: spacing.md },
  resetLink: { alignItems: 'center', paddingVertical: spacing.lg },
  resetLinkLabel: { ...type.small, color: color.inkFaint, textDecorationLine: 'underline' },
});
