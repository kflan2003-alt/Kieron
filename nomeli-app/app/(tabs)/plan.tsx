import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { ReplanProposalCard } from '../../src/components/ReplanProposalCard';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { RECIPES } from '../../src/services/mockData';
import { DayStatus } from '../../src/types';
import { color, radius, spacing, type } from '../../src/theme/tokens';

const STATUS_LABEL: Record<DayStatus, string> = {
  cooking: 'Cooking',
  eating_out: 'Eating out',
  working_late: 'Working late',
  unavailable: 'Unavailable',
  leftovers: 'Leftovers',
  quick_meal: 'Quick meal',
};

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' });
}

export default function PlanScreen() {
  const router = useRouter();
  const entries = useMealPlanStore((s) => s.entries);
  const setDayStatus = useMealPlanStore((s) => s.setDayStatus);
  const kitchen = useKitchenStore((s) => s.items);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Week</Text>
        <Pressable onPress={() => router.push('/shopping')}>
          <Text style={styles.shoppingLink}>Shopping list</Text>
        </Pressable>
      </View>

      <ReplanProposalCard />

      <View style={styles.list}>
        {entries.map((entry) => {
          const recipe = entry.recipeId ? RECIPES.find((r) => r.id === entry.recipeId) : null;
          return (
            <Card key={entry.id} style={styles.dayCard}>
              <Text style={styles.dayName}>{dayLabel(entry.date)}</Text>

              {entry.status === 'cooking' && recipe ? (
                <Pressable onPress={() => router.push(`/meal/${recipe.id}`)}>
                  <Text style={styles.mealName}>{recipe.name}</Text>
                  <Text style={styles.mealMeta}>{recipe.prepMinutes} mins</Text>
                  {entry.reason ? <Text style={styles.reason}>Why this meal? {entry.reason}</Text> : null}
                </Pressable>
              ) : entry.status === 'cooking' ? (
                <Text style={styles.mealMeta}>Nothing planned</Text>
              ) : (
                <Text style={styles.mealMeta}>{STATUS_LABEL[entry.status]}</Text>
              )}

              <View style={styles.statusRow}>
                {(Object.keys(STATUS_LABEL) as DayStatus[]).map((s) => (
                  <Pressable key={s} onPress={() => setDayStatus(entry.date, s)} style={[styles.statusChip, entry.status === s && styles.statusChipActive]}>
                    <Text style={[styles.statusChipLabel, entry.status === s && styles.statusChipLabelActive]}>{STATUS_LABEL[s]}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  title: { ...type.h1, color: color.ink },
  shoppingLink: { ...type.bodyMedium, color: color.avocadoDark },
  list: { gap: spacing.md },
  dayCard: { gap: spacing.xs },
  dayName: { ...type.caption, color: color.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName: { ...type.h2, color: color.ink, marginTop: 2 },
  mealMeta: { ...type.small, color: color.inkDim },
  reason: { ...type.small, color: color.avocadoDark, fontStyle: 'italic', marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  statusChip: { borderWidth: 1, borderColor: color.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusChipActive: { backgroundColor: color.sageSoft, borderColor: color.sage },
  statusChipLabel: { fontSize: 11, color: color.inkDim, fontWeight: '600' },
  statusChipLabelActive: { color: color.avocadoDark },
});
