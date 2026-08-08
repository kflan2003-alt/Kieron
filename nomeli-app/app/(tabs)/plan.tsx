import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { ReplanProposalCard } from '../../src/components/ReplanProposalCard';
import { Avocado, PeekingAvocado } from '../../src/components/Avocado';
import { SpeechBubble } from '../../src/components/SpeechBubble';
import { HandwrittenNote } from '../../src/components/HandwrittenNote';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { RECIPES } from '../../src/services/mockData';
import { DayStatus } from '../../src/types';
import { color, radius, spacing, type, shadow } from '../../src/theme/tokens';

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

function CartIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" stroke={color.avocadoDark} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={10} cy={21} r={1.4} fill={color.avocadoDark} />
      <Circle cx={17} cy={21} r={1.4} fill={color.avocadoDark} />
    </Svg>
  );
}

function KebabIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={5.5} r={1.3} fill={color.inkFaint} />
      <Circle cx={12} cy={12} r={1.3} fill={color.inkFaint} />
      <Circle cx={12} cy={18.5} r={1.3} fill={color.inkFaint} />
    </Svg>
  );
}

export default function PlanScreen() {
  const router = useRouter();
  const entries = useMealPlanStore((s) => s.entries);
  const setDayStatus = useMealPlanStore((s) => s.setDayStatus);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Week</Text>
        <Pressable onPress={() => router.push('/shopping')} style={styles.shoppingButton}>
          <CartIcon />
          <Text style={styles.shoppingLabel}>Shopping list</Text>
        </Pressable>
      </View>

      <View style={styles.introRow}>
        <Avocado size={44} />
        <SpeechBubble style={styles.introBubble}>
          <Text style={styles.introText}>
            I've planned these meals around what you have and what's expiring first. <Text style={styles.heart}>❤️</Text>
          </Text>
        </SpeechBubble>
      </View>

      <ReplanProposalCard />

      <View style={styles.list}>
        {entries.map((entry, index) => {
          const recipe = entry.recipeId ? RECIPES.find((r) => r.id === entry.recipeId) : null;
          const isAnnotated = index === 2 && entry.status === 'cooking' && recipe;
          return (
            <View key={entry.id} style={styles.cardWrap}>
              <Card style={styles.dayCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTextCol}>
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
                  </View>
                  {entry.status === 'cooking' && recipe ? (
                    <View style={styles.thumb}>
                      <Text style={styles.thumbEmoji}>{recipe.imageEmoji}</Text>
                    </View>
                  ) : (
                    <Pressable hitSlop={8}>
                      <KebabIcon />
                    </Pressable>
                  )}
                </View>

                <View style={styles.statusRow}>
                  {(Object.keys(STATUS_LABEL) as DayStatus[]).map((s) => (
                    <Pressable key={s} onPress={() => setDayStatus(entry.date, s)} style={[styles.statusChip, entry.status === s && styles.statusChipActive]}>
                      <Text style={[styles.statusChipLabel, entry.status === s && styles.statusChipLabelActive]}>{STATUS_LABEL[s]}</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
              {isAnnotated && (
                <>
                  <HandwrittenNote label="We've got this!" curve="down-left" style={styles.annotation} />
                  <PeekingAvocado size={48} side="right" style={styles.annotationPeek} />
                </>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  title: { ...type.h1, color: color.ink },
  shoppingButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  shoppingLabel: { ...type.small, fontWeight: '700', color: color.avocadoDark },
  introRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.lg },
  introBubble: {},
  introText: { ...type.body, color: color.ink },
  heart: { color: color.urgentTomorrow },
  list: { gap: spacing.xxl },
  cardWrap: { position: 'relative' },
  dayCard: { gap: spacing.xs },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  cardTextCol: { flex: 1 },
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  thumbEmoji: { fontSize: 28 },
  dayName: { ...type.caption, color: color.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName: { ...type.h2, color: color.ink, marginTop: 2 },
  mealMeta: { ...type.small, color: color.inkDim },
  reason: { ...type.small, color: color.avocadoDark, fontStyle: 'italic', marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  statusChip: { borderWidth: 1, borderColor: color.line, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusChipActive: { backgroundColor: color.sageSoft, borderColor: color.sage },
  statusChipLabel: { fontSize: 11, color: color.inkDim, fontWeight: '600' },
  statusChipLabelActive: { color: color.avocadoDark },
  annotation: { position: 'absolute', bottom: -26, left: 4 },
  annotationPeek: { bottom: -20 },
});
