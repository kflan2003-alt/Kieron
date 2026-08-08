import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { UrgencyBadge } from '../../src/components/UrgencyBadge';
import { Button } from '../../src/components/Button';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { FoodCategory } from '../../src/types';
import { urgencyRank, getExpiryUrgency } from '../../src/utils/expiry';
import { foodEmoji } from '../../src/utils/foodEmoji';
import { color, radius, spacing, type } from '../../src/theme/tokens';

type Filter = 'all' | FoodCategory;
type Sort = 'expiring' | 'recent' | 'category';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'cupboard', label: 'Cupboard' },
  { value: 'fruit_veg', label: 'Fruit & Veg' },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'recent', label: 'Recently added' },
  { value: 'category', label: 'Category' },
];

export default function KitchenScreen() {
  const router = useRouter();
  const items = useKitchenStore((s) => s.items);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('expiring');

  const visible = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter((i) => i.category === filter);
    list = [...list];
    if (sort === 'expiring') {
      list.sort((a, b) => urgencyRank(getExpiryUrgency(a.expiryDate)) - urgencyRank(getExpiryUrgency(b.expiryDate)));
    } else if (sort === 'recent') {
      list.sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1));
    } else {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [items, filter, sort]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Kitchen</Text>
        <Pressable onPress={() => router.push('/kitchen/add')} style={styles.addButton}>
          <Text style={styles.addButtonLabel}>+ Add item</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.value} onPress={() => setFilter(f.value)} style={[styles.chip, filter === f.value && styles.chipActive]}>
            <Text style={[styles.chipLabel, filter === f.value && styles.chipLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <Pressable key={s.value} onPress={() => setSort(s.value)}>
            <Text style={[styles.sortLabel, sort === s.value && styles.sortLabelActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {visible.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nothing here yet. Scan or add your first item to get started.</Text>
          <Button label="Add item" variant="secondary" onPress={() => router.push('/kitchen/add')} />
        </Card>
      ) : (
        <View style={styles.list}>
          {visible.map((item) => (
            <Card key={item.id} onPress={() => router.push(`/kitchen/${item.id}`)} style={styles.row}>
              <Text style={styles.rowEmoji}>{foodEmoji(item.name, item.category)}</Text>
              <View style={styles.rowMid}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.quantity} {item.unit}
                  {item.needsCheck ? ' · Check this' : ''}
                </Text>
              </View>
              <UrgencyBadge expiryDate={item.expiryDate} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  title: { ...type.h1, color: color.ink },
  addButton: { backgroundColor: color.avocadoDark, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  addButtonLabel: { ...type.small, fontWeight: '700', color: color.white },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderColor: color.line, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: color.surface },
  chipActive: { backgroundColor: color.avocadoDark, borderColor: color.avocadoDark },
  chipLabel: { ...type.small, fontWeight: '600', color: color.ink },
  chipLabelActive: { color: color.white },
  sortRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  sortLabel: { ...type.small, color: color.inkFaint },
  sortLabelActive: { color: color.avocadoDark, fontWeight: '700' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowEmoji: { fontSize: 24 },
  rowMid: { flex: 1, gap: 2 },
  rowName: { ...type.bodyMedium, color: color.ink },
  rowMeta: { ...type.small, color: color.inkDim },
  emptyText: { ...type.body, color: color.inkDim, marginBottom: spacing.md },
});
