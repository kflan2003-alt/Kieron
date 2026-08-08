import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Avocado } from '../../src/components/Avocado';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useScanSessionStore } from '../../src/store/useScanSessionStore';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { usePreferencesStore } from '../../src/store/usePreferencesStore';
import { getFoodRecognitionService } from '../../src/services/foodRecognitionService';
import { FoodRecognitionResultItem } from '../../src/types';
import { formatDate } from '../../src/utils/expiry';
import { color, radius, spacing, type } from '../../src/theme/tokens';

export default function ScanConfirmScreen() {
  const router = useRouter();
  const photoUris = useScanSessionStore((s) => s.photoUris);
  const result = useScanSessionStore((s) => s.result);
  const setResult = useScanSessionStore((s) => s.setResult);
  const resetSession = useScanSessionStore((s) => s.reset);
  const addFromRecognition = useKitchenStore((s) => s.addFromRecognition);
  const kitchen = useKitchenStore((s) => s.items);
  const checkForReplan = useMealPlanStore((s) => s.checkForReplan);
  const preferences = usePreferencesStore((s) => s.preferences);

  const [items, setItems] = useState<FoodRecognitionResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFoodRecognitionService()
      .recognise(photoUris)
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setItems(res.items);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (index: number, patch: Partial<FoodRecognitionResultItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch, uncertainField: undefined, uncertainNote: undefined } : item)));
  };

  const confirm = () => {
    const added = addFromRecognition(items);
    added.forEach((food) => {
      if (food.expiryDate) checkForReplan(food, [...kitchen, ...added], preferences);
    });
    resetSession();
    router.replace('/(tabs)/kitchen');
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <Avocado size={80} pose="thinking" />
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={color.avocadoDark} />
        <Text style={styles.loadingText}>Nomeli is checking your food…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>We found {items.length} item{items.length === 1 ? '' : 's'}.</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <Card key={i} style={styles.itemCard}>
            <View style={styles.itemHeaderRow}>
              <TextInput
                value={item.name}
                onChangeText={(v) => updateItem(i, { name: v })}
                style={styles.nameInput}
              />
              <Text style={styles.confidence}>
                {item.confidence >= 0.75 ? 'High confidence' : item.confidence >= 0.5 ? 'Medium confidence' : 'Low confidence'}
              </Text>
            </View>
            <Text style={styles.metaLine}>
              {item.expiryDate ? `Use by ${formatDate(item.expiryDate)}` : 'No expiry date'}
            </Text>
            {item.uncertainNote ? (
              <View style={styles.checkThisRow}>
                <Text style={styles.checkThisLabel}>Check this — {item.uncertainNote}</Text>
                <Pressable onPress={() => updateItem(i, {})}>
                  <Text style={styles.checkThisDismiss}>Looks right</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ))}
      </View>
      <Button label={`Add ${items.length} item${items.length === 1 ? '' : 's'} to My Kitchen`} onPress={confirm} block style={styles.confirmButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.background, gap: spacing.sm },
  loadingText: { ...type.body, color: color.inkDim, marginTop: spacing.sm },
  root: { flex: 1, backgroundColor: color.background, paddingTop: 64, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { ...type.h1, color: color.ink, marginBottom: spacing.lg },
  list: { gap: spacing.sm, flex: 1 },
  itemCard: { gap: 4 },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameInput: { ...type.bodyMedium, color: color.ink, flex: 1, paddingVertical: 2 },
  confidence: { ...type.caption, color: color.inkFaint },
  metaLine: { ...type.small, color: color.inkDim },
  checkThisRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: color.urgentTomorrowSoft, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.xs },
  checkThisLabel: { ...type.small, color: color.urgentTomorrow, flex: 1, marginRight: spacing.sm },
  checkThisDismiss: { ...type.small, color: color.avocadoDark, fontWeight: '700' },
  confirmButton: { marginTop: spacing.lg },
});
