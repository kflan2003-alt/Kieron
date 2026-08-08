import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { useShoppingStore } from '../src/store/useShoppingStore';
import { color, radius, spacing, type } from '../src/theme/tokens';

export default function ShoppingListScreen() {
  const items = useShoppingStore((s) => s.items);
  const toggle = useShoppingStore((s) => s.toggle);
  const remove = useShoppingStore((s) => s.remove);
  const addManual = useShoppingStore((s) => s.addManual);
  const [draft, setDraft] = useState('');

  const fromRecipes = items.filter((i) => i.source === 'recipe');
  const other = items.filter((i) => i.source === 'manual');

  const addDraft = () => {
    if (draft.trim()) addManual(draft.trim());
    setDraft('');
  };

  return (
    <Screen>
      <Text style={styles.sectionTitle}>Needed for meals</Text>
      {fromRecipes.length === 0 ? (
        <Text style={styles.emptyText}>Nothing needed — your kitchen covers this week's meals.</Text>
      ) : (
        <View style={styles.list}>
          {fromRecipes.map((item) => (
            <Row key={item.id} name={item.name} qty={item.quantity} checked={item.checked} onToggle={() => toggle(item.id)} onRemove={() => remove(item.id)} />
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Other items</Text>
      {other.length === 0 ? (
        <Text style={styles.emptyText}>Nothing else on the list.</Text>
      ) : (
        <View style={styles.list}>
          {other.map((item) => (
            <Row key={item.id} name={item.name} qty={item.quantity} checked={item.checked} onToggle={() => toggle(item.id)} onRemove={() => remove(item.id)} />
          ))}
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addDraft}
          placeholder="Add an item"
          placeholderTextColor={color.inkFaint}
          returnKeyType="done"
        />
        <Button label="Add" onPress={addDraft} />
      </View>
    </Screen>
  );
}

function Row({ name, qty, checked, onToggle, onRemove }: { name: string; qty?: string; checked: boolean; onToggle: () => void; onRemove: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={[styles.rowLabel, checked && styles.rowLabelChecked]}>{name}</Text>
      {qty ? <Text style={styles.rowQty}>{qty}</Text> : null}
      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.remove}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...type.h2, color: color.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyText: { ...type.small, color: color.inkFaint, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: color.surface, borderRadius: radius.md, padding: spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: color.sage, borderColor: color.sage },
  checkmark: { color: color.white, fontSize: 12, fontWeight: '700' },
  rowLabel: { ...type.body, color: color.ink, flex: 1 },
  rowLabelChecked: { color: color.inkFaint, textDecorationLine: 'line-through' },
  rowQty: { ...type.small, color: color.inkDim },
  remove: { color: color.inkFaint, fontSize: 14 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.xl, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: color.ink,
    backgroundColor: color.surface,
  },
});
