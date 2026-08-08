import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { useMealPlanStore } from '../../src/store/useMealPlanStore';
import { usePreferencesStore } from '../../src/store/usePreferencesStore';
import { FoodCategory, ExpiryType } from '../../src/types';
import { addDays, todayISO } from '../../src/utils/expiry';
import { color, radius, spacing, type } from '../../src/theme/tokens';

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'cupboard', label: 'Cupboard' },
  { value: 'fruit_veg', label: 'Fruit & Veg' },
];

const EXPIRY_TYPES: { value: ExpiryType; label: string }[] = [
  { value: 'use_by', label: 'Use by' },
  { value: 'best_before', label: 'Best before' },
  { value: 'none', label: 'No expiry' },
];

export default function AddOrEditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useKitchenStore((s) => (id ? s.getById(id) : undefined));
  const addItem = useKitchenStore((s) => s.addItem);
  const updateItem = useKitchenStore((s) => s.updateItem);
  const kitchenItems = useKitchenStore((s) => s.items);
  const checkForReplan = useMealPlanStore((s) => s.checkForReplan);
  const preferences = usePreferencesStore((s) => s.preferences);

  const [name, setName] = useState(existing?.name ?? '');
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? 'unit');
  const [category, setCategory] = useState<FoodCategory>(existing?.category ?? 'fridge');
  const [expiryType, setExpiryType] = useState<ExpiryType>(existing?.expiryType ?? 'use_by');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(
    existing?.expiryDate ? String(Math.max(0, Math.round((new Date(existing.expiryDate).getTime() - Date.now()) / 86400000))) : '3',
  );

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const expiryDate = expiryType === 'none' ? null : addDays(todayISO(), Number(daysUntilExpiry) || 0);
    const payload = {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'unit',
      category,
      expiryDate,
      expiryType,
      opened: existing?.opened ?? false,
      imageUrl: existing?.imageUrl ?? null,
      recognitionConfidence: existing?.recognitionConfidence ?? null,
    };
    if (existing) {
      updateItem(existing.id, payload);
    } else {
      const created = addItem(payload);
      if (created.expiryDate) checkForReplan(created, [...kitchenItems, created], preferences);
    }
    router.back();
  };

  return (
    <Screen>
      <Text style={styles.label}>Food name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Chicken breast" placeholderTextColor={color.inkFaint} />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Unit</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="g, portions…" placeholderTextColor={color.inkFaint} />
        </View>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.value} onPress={() => setCategory(c.value)} style={[styles.chip, category === c.value && styles.chipActive]}>
            <Text style={[styles.chipLabel, category === c.value && styles.chipLabelActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Expiry</Text>
      <View style={styles.chipRow}>
        {EXPIRY_TYPES.map((e) => (
          <Pressable key={e.value} onPress={() => setExpiryType(e.value)} style={[styles.chip, expiryType === e.value && styles.chipActive]}>
            <Text style={[styles.chipLabel, expiryType === e.value && styles.chipLabelActive]}>{e.label}</Text>
          </Pressable>
        ))}
      </View>

      {expiryType !== 'none' && (
        <>
          <Text style={styles.label}>Days from today</Text>
          <TextInput style={styles.input} value={daysUntilExpiry} onChangeText={setDaysUntilExpiry} keyboardType="numeric" />
        </>
      )}

      <Button label={existing ? 'Save changes' : 'Add to My Kitchen'} onPress={save} disabled={!canSave} block style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.small, color: color.inkDim, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.lg },
  input: {
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: color.ink,
    backgroundColor: color.surface,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1.5, borderColor: color.line, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: color.surface },
  chipActive: { backgroundColor: color.avocadoDark, borderColor: color.avocadoDark },
  chipLabel: { ...type.small, fontWeight: '600', color: color.ink },
  chipLabelActive: { color: color.white },
  saveButton: { marginTop: spacing.xxl, marginBottom: spacing.xl },
});
