import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useShoppingStore } from '../../src/store/useShoppingStore';
import { RECIPES } from '../../src/services/mockData';
import { color, radius, spacing, type } from '../../src/theme/tokens';

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

export default function MealDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = RECIPES.find((r) => r.id === id);
  const kitchen = useKitchenStore((s) => s.items);
  const markUsed = useKitchenStore((s) => s.markUsed);
  const addManualShoppingItem = useShoppingStore((s) => s.addManual);
  const [cooking, setCooking] = useState(false);
  const [askRemove, setAskRemove] = useState(false);

  if (!recipe) {
    return (
      <Screen>
        <Text style={styles.notFound}>Recipe not found.</Text>
      </Screen>
    );
  }

  const have = recipe.ingredients.filter((ing) => kitchen.some((f) => normalise(f.name) === normalise(ing.name)));
  const need = recipe.ingredients.filter((ing) => !kitchen.some((f) => normalise(f.name) === normalise(ing.name)));

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{recipe.imageEmoji}</Text>
      </View>
      <Text style={styles.name}>{recipe.name}</Text>
      <Text style={styles.meta}>
        {recipe.prepMinutes} mins · Serves {recipe.servings}
      </Text>

      <View style={styles.haveNeedRow}>
        <View style={styles.haveNeedCol}>
          <Text style={styles.colTitle}>You have</Text>
          {have.map((ing) => (
            <Text key={ing.name} style={styles.haveItem}>✓ {ing.name}</Text>
          ))}
          {have.length === 0 && <Text style={styles.emptyMini}>Nothing yet</Text>}
        </View>
        <View style={styles.haveNeedCol}>
          <Text style={styles.colTitle}>You need</Text>
          {need.map((ing) => (
            <Text key={ing.name} style={styles.needItem}>• {ing.name}</Text>
          ))}
          {need.length === 0 && <Text style={styles.emptyMini}>You have it all</Text>}
        </View>
      </View>

      {need.length > 0 && (
        <Button
          label="Add missing items to shopping list"
          variant="secondary"
          onPress={() => need.forEach((ing) => addManualShoppingItem(ing.name, `${ing.quantity}${ing.unit === 'unit' ? '' : ing.unit}`))}
          block
          style={styles.addMissingButton}
        />
      )}

      <Text style={styles.sectionTitle}>{cooking ? 'Steps' : 'Ingredients'}</Text>
      {!cooking ? (
        <Card style={styles.card}>
          {recipe.ingredients.map((ing) => (
            <Text key={ing.name} style={styles.ingredientLine}>
              {ing.quantity}{ing.unit === 'unit' ? '' : ing.unit} {ing.name}
            </Text>
          ))}
        </Card>
      ) : (
        <Card style={styles.card}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberLabel}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>
      )}

      {askRemove ? (
        <Card style={styles.askCard}>
          <Text style={styles.askText}>Remove the used ingredients from My Kitchen?</Text>
          <View style={styles.askActions}>
            <Button
              label="Not now"
              variant="secondary"
              onPress={() => {
                setAskRemove(false);
                router.back();
              }}
              style={styles.flexButton}
            />
            <Button
              label="Yes, remove"
              onPress={() => {
                have.forEach((ing) => {
                  const match = kitchen.find((f) => normalise(f.name) === normalise(ing.name));
                  if (match) markUsed(match.id);
                });
                setAskRemove(false);
                router.back();
              }}
              style={styles.flexButton}
            />
          </View>
        </Card>
      ) : cooking ? (
        <Button label="I made this" onPress={() => setAskRemove(true)} block style={styles.mainButton} />
      ) : (
        <Button label="Start cooking" onPress={() => setCooking(true)} block style={styles.mainButton} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { ...type.body, color: color.inkDim, marginTop: spacing.xl },
  hero: { height: 120, borderRadius: radius.lg, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  heroEmoji: { fontSize: 56 },
  name: { ...type.h1, color: color.ink },
  meta: { ...type.body, color: color.inkDim, marginBottom: spacing.lg },
  haveNeedRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  haveNeedCol: { flex: 1, gap: 4 },
  colTitle: { ...type.caption, color: color.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  haveItem: { ...type.small, color: color.avocadoDark },
  needItem: { ...type.small, color: color.urgentTomorrow },
  emptyMini: { ...type.small, color: color.inkFaint },
  addMissingButton: { marginBottom: spacing.lg },
  sectionTitle: { ...type.h2, color: color.ink, marginBottom: spacing.sm },
  card: { gap: spacing.sm, marginBottom: spacing.lg },
  ingredientLine: { ...type.body, color: color.ink },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' },
  stepNumberLabel: { fontSize: 11, fontWeight: '700', color: color.avocadoDark },
  stepText: { ...type.body, color: color.ink, flex: 1 },
  askCard: { backgroundColor: color.sageSoft, gap: spacing.md, marginBottom: spacing.xl },
  askText: { ...type.body, color: color.ink },
  askActions: { flexDirection: 'row', gap: spacing.sm },
  flexButton: { flex: 1 },
  mainButton: { marginBottom: spacing.xl },
});
