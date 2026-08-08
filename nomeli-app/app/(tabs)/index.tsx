import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { NomeliNote } from '../../src/components/NomeliNote';
import { UrgencyBadge } from '../../src/components/UrgencyBadge';
import { ReplanProposalCard } from '../../src/components/ReplanProposalCard';
import { HandwrittenNote } from '../../src/components/HandwrittenNote';
import { PeekingAvocado } from '../../src/components/Avocado';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { usePreferencesStore } from '../../src/store/usePreferencesStore';
import { getMealGenerationService } from '../../src/services/mealGenerationService';
import { RECIPES } from '../../src/services/mockData';
import { getExpiryUrgency, urgencyRank, todayISO } from '../../src/utils/expiry';
import { foodEmoji } from '../../src/utils/foodEmoji';
import { color, spacing, type, radius, shadow } from '../../src/theme/tokens';

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke={color.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={color.ink} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="m9 5 7 7-7 7" stroke={color.avocadoDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
        <View>
          <Text style={styles.eyebrow}>{greeting},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Pressable style={styles.bellButton}>
          <BellIcon />
        </Pressable>
      </View>

      <View style={styles.noteRow}>
        <NomeliNote message={nomeliNote} />
      </View>

      <ReplanProposalCard />

      <Text style={styles.sectionTitle}>Tonight ✨</Text>
      {tonightRecipe ? (
        <View style={styles.tonightWrap}>
          <Card style={styles.tonightCard} padded={false}>
            <View style={styles.tonightPhoto}>
              <Text style={styles.tonightEmoji}>{tonightRecipe.imageEmoji}</Text>
            </View>
            <View style={styles.tonightBody}>
              <Text style={styles.tonightName}>{tonightRecipe.name}</Text>
              <Text style={styles.tonightMeta}>
                {tonightRecipe.prepMinutes} mins · Uses {tonightHaveCount} ingredient{tonightHaveCount === 1 ? '' : 's'} from your kitchen
              </Text>
              {tonight?.reason ? <Text style={styles.tonightReason}>{tonight.reason}</Text> : null}
              <Button label="View meal" onPress={() => router.push(`/meal/${tonightRecipe.id}`)} block style={styles.viewMealButton} />
            </View>
          </Card>
          <HandwrittenNote label="Nice and easy! ❤️" curve="down-right" style={styles.tonightNote} />
        </View>
      ) : (
        <Card>
          <Text style={styles.emptyText}>Nothing planned for tonight yet.</Text>
          <Button label="Go to Plan" variant="secondary" onPress={() => router.push('/(tabs)/plan')} />
        </Card>
      )}

      <Text style={styles.sectionTitle}>Use Soon</Text>
      {useSoon.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Nothing expiring soon.</Text>
          <PeekingAvocado size={56} side="right" style={styles.useSoonPeek} />
        </View>
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
        <Card onPress={() => {
          const target = entries.find((e) => e.status === 'cooking' && !e.recipeId) ?? entries.find((e) => e.date === today);
          if (target) setDayRecipe(target.date, suggestion.id, "You've already got everything you need for this.");
        }} style={styles.suggestCard}>
          <Text style={styles.suggestText}>
            You have everything needed for <Text style={styles.suggestBold}>{suggestion.name.toLowerCase()}</Text>.
          </Text>
          <ChevronRight />
        </Card>
      ) : (
        <View style={styles.emptyRow}>
          <Card style={{ flex: 1 }}>
            <Text style={styles.emptyText}>Scan a few items and Nomeli will start suggesting meals.</Text>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...type.body, color: color.inkDim },
  name: { ...type.hero, color: color.ink },
  bellButton: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  noteRow: { position: 'relative' },
  sectionTitle: { ...type.h2, color: color.ink, marginTop: spacing.xl, marginBottom: spacing.md },
  tonightWrap: { position: 'relative' },
  tonightCard: { overflow: 'hidden' },
  tonightPhoto: { height: 130, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' },
  tonightEmoji: { fontSize: 54 },
  tonightBody: { padding: spacing.lg, gap: spacing.xs },
  tonightName: { ...type.h1, color: color.ink },
  tonightMeta: { ...type.small, color: color.inkDim, marginBottom: spacing.xs },
  tonightReason: { ...type.small, color: color.avocadoDark, marginBottom: spacing.md, fontStyle: 'italic' },
  viewMealButton: { marginTop: spacing.xs },
  tonightNote: { position: 'absolute', right: 10, top: -30 },
  emptyText: { ...type.body, color: color.inkDim, marginBottom: spacing.md },
  emptyRow: { position: 'relative', paddingRight: 40 },
  useSoonPeek: { bottom: -10 },
  useSoonRow: { marginBottom: spacing.sm },
  useSoonCard: { width: 120, marginRight: spacing.md, alignItems: 'flex-start', gap: spacing.xs },
  useSoonEmoji: { fontSize: 26 },
  useSoonName: { ...type.bodyMedium, color: color.ink },
  suggestCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  suggestText: { ...type.body, color: color.ink, flex: 1 },
  suggestBold: { fontWeight: '700' },
});
