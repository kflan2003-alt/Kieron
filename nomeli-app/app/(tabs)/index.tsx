import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { NomeliNote } from '../../src/components/NomeliNote';
import { UrgencyBadge } from '../../src/components/UrgencyBadge';
import { ReplanProposalCard } from '../../src/components/ReplanProposalCard';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { usePreferencesStore } from '../../src/store/usePreferencesStore';
import { getMealGenerationService } from '../../src/services/mealGenerationService';
import { RECIPES } from '../../src/services/mockData';
import { getExpiryUrgency, urgencyRank, todayISO } from '../../src/utils/expiry';
import { foodEmoji } from '../../src/utils/foodEmoji';
import { color, spacing, type, radius } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const items = useKitchenStore((s) => s.items);
  const preferences = usePreferencesStore((s) => s.preferences);
  const entries = useMealPlanStore((s) => s.entries);
  const setDayRecipe = useMealPlanStore((s) => s.setDayRecipe);

  const firstName = preferences.name.trim().split(' ')[0] || 'there';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const today = todayISO();
  const tonight = entries.find((e) => e.date === today);
  const tonightRecipe = tonight?.recipeId ? RECIPES.find((r) => r.id === tonight.recipeId) : null;
  const tonightHaveCount = tonightRecipe
    ? tonightRecipe.ingredients.filter((ing) =>
        items.some((f) => f.name.trim().toLowerCase() === ing.name.trim().toLowerCase()),
      ).length
    : 0;

  const useSoon = useMemo(
    () =>
      [...items]
        .filter((i) => getExpiryUrgency(i.expiryDate) !== 'longlife')
        .sort((a, b) => urgencyRank(getExpiryUrgency(a.expiryDate)) - urgencyRank(getExpiryUrgency(b.expiryDate)))
        .slice(0, 8),
    [items],
  );

  const mostUrgent = useSoon[0];
  const nomeliNote = useMemo(() => {
    if (!mostUrgent) return "You're all caught up — nothing in your kitchen needs using urgently.";
    const urgency = getExpiryUrgency(mostUrgent.expiryDate);
    const usedTonight = tonightRecipe?.ingredients.some(
      (ing) => ing.name.trim().toLowerCase() === mostUrgent.name.trim().toLowerCase(),
    );
    if (usedTonight) {
      return `Your ${mostUrgent.name.toLowerCase()} expires ${urgency === 'today' ? 'today' : 'soon'}. I've prioritised it in tonight's dinner.`;
    }
    if (urgency === 'today' || urgency === 'tomorrow') {
      return `Your ${mostUrgent.name.toLowerCase()} expires ${urgency === 'today' ? 'today' : 'tomorrow'}. Want me to plan around it?`;
    }
    return `Your ${mostUrgent.name.toLowerCase()} needs using in the next few days.`;
  }, [mostUrgent, tonightRecipe]);

  const suggestion = useMemo(() => {
    const suggestions = getMealGenerationService().suggestForKitchen(items, preferences);
    return suggestions.find((r) => r.id !== tonight?.recipeId) ?? suggestions[0];
  }, [items, preferences, tonight?.recipeId]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{greeting},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      <NomeliNote message={nomeliNote} />

      <ReplanProposalCard />

      <Text style={styles.sectionTitle}>Tonight</Text>
      {tonightRecipe ? (
        <Card style={styles.tonightCard}>
          <Text style={styles.tonightEmoji}>{tonightRecipe.imageEmoji}</Text>
          <Text style={styles.tonightName}>{tonightRecipe.name}</Text>
          <Text style={styles.tonightMeta}>
            {tonightRecipe.prepMinutes} mins · Uses {tonightHaveCount} ingredient{tonightHaveCount === 1 ? '' : 's'} from your kitchen
          </Text>
          {tonight?.reason ? <Text style={styles.tonightReason}>{tonight.reason}</Text> : null}
          <Button label="View meal" onPress={() => router.push(`/meal/${tonightRecipe.id}`)} block />
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>Nothing planned for tonight yet.</Text>
          <Button label="Go to Plan" variant="secondary" onPress={() => router.push('/(tabs)/plan')} />
        </Card>
      )}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Use Soon</Text>
      </View>
      {useSoon.length === 0 ? (
        <Text style={styles.emptyText}>Nothing expiring soon.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.useSoonRow}>
          {useSoon.map((item) => (
            <Card key={item.id} onPress={() => router.push(`/kitchen/${item.id}`)} style={styles.useSoonCard}>
              <Text style={styles.useSoonEmoji}>{foodEmoji(item.name, item.category)}</Text>
              <Text style={styles.useSoonName} numberOfLines={1}>{item.name}</Text>
              <UrgencyBadge expiryDate={item.expiryDate} />
            </Card>
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>Nomeli Suggests</Text>
      {suggestion ? (
        <Card style={styles.suggestCard}>
          <Text style={styles.suggestText}>
            You have everything needed for <Text style={styles.suggestBold}>{suggestion.name.toLowerCase()}</Text>.
          </Text>
          <Button
            label="Add to plan"
            variant="secondary"
            onPress={() => {
              const target = entries.find((e) => e.status === 'cooking' && !e.recipeId) ?? entries.find((e) => e.date === today);
              if (target) setDayRecipe(target.date, suggestion.id, "You've already got everything you need for this.");
            }}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>Scan a few items and Nomeli will start suggesting meals.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...type.body, color: color.inkDim },
  name: { ...type.hero, fontFamily: undefined, color: color.ink },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...type.h2, color: color.ink, marginTop: spacing.xl, marginBottom: spacing.md },
  tonightCard: { alignItems: 'flex-start', gap: spacing.xs },
  tonightEmoji: { fontSize: 40, marginBottom: spacing.xs },
  tonightName: { ...type.h1, color: color.ink },
  tonightMeta: { ...type.small, color: color.inkDim, marginBottom: spacing.xs },
  tonightReason: { ...type.small, color: color.avocadoDark, marginBottom: spacing.md, fontStyle: 'italic' },
  emptyText: { ...type.body, color: color.inkDim, marginBottom: spacing.md },
  useSoonRow: { marginBottom: spacing.sm },
  useSoonCard: { width: 120, marginRight: spacing.md, alignItems: 'flex-start', gap: spacing.xs },
  useSoonEmoji: { fontSize: 26 },
  useSoonName: { ...type.bodyMedium, color: color.ink },
  suggestCard: { gap: spacing.md },
  suggestText: { ...type.body, color: color.ink },
  suggestBold: { fontWeight: '700' },
});
