import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { UrgencyBadge } from '../../src/components/UrgencyBadge';
import { Button } from '../../src/components/Button';
import { HandwrittenNote } from '../../src/components/HandwrittenNote';
import { PeekingAvocado } from '../../src/components/Avocado';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { FoodCategory } from '../../src/types';
import { urgencyRank, getExpiryUrgency } from '../../src/utils/expiry';
import { foodEmoji } from '../../src/utils/foodEmoji';
import { color, radius, spacing, type, shadow } from '../../src/theme/tokens';

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

function ChevronDown() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color.avocadoDark} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function KitchenScreen() {
  const router = useRouter();
  const items = useKitchenStore((s) => s.items);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('expiring');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

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

      <Pressable style={styles.sectionHeaderRow} onPress={() => setSortMenuOpen((v) => !v)}>
        <Text style={styles.sectionTitle}>{SORTS.find((s) => s.value === sort)?.label}</Text>
        <ChevronDown />
      </Pressable>
      {sortMenuOpen && (
        <View style={styles.sortMenu}>
          {SORTS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => {
                setSort(s.value);
                setSortMenuOpen(false);
              }}
              style={styles.sortMenuItem}
            >
              <Text style={[styles.sortMenuLabel, sort === s.value && styles.sortMenuLabelActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {visible.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nothing here yet. Scan or add your first item to get started.</Text>
          <Button label="Add item" variant="secondary" onPress={() => router.push('/kitchen/add')} />
        </Card>
      ) : (
        <View style={styles.listWrap}>
          <View style={styles.list}>
            {visible.map((item, i) => (
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
                {i === 0 && <HandwrittenNote label="Tap me for details!" curve="down-right" style={styles.firstItemNote} />}
              </Card>
            ))}
          </View>
          <PeekingAvocado size={60} side="right" style={styles.peek} />
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { borderWidth: 1.5, borderColor: color.line, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: color.surface },
  chipActive: { backgroundColor: color.avocadoDark, borderColor: color.avocadoDark },
  chipLabel: { ...type.small, fontWeight: '600', color: color.ink },
  chipLabelActive: { color: color.white },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  sectionTitle: { ...type.h2, color: color.avocadoDark },
  sortMenu: { backgroundColor: color.surface, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden', ...shadow.soft },
  sortMenuItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sortMenuLabel: { ...type.body, color: color.inkDim },
  sortMenuLabelActive: { color: color.avocadoDark, fontWeight: '700' },
  listWrap: { position: 'relative' },
  list: { gap: spacing.sm, marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, position: 'relative' },
  rowEmoji: { fontSize: 24 },
  rowMid: { flex: 1, gap: 2 },
  rowName: { ...type.bodyMedium, color: color.ink },
  rowMeta: { ...type.small, color: color.inkDim },
  emptyText: { ...type.body, color: color.inkDim, marginBottom: spacing.md },
  firstItemNote: { position: 'absolute', right: 8, top: -30 },
  peek: { top: 60, bottom: undefined },
});
