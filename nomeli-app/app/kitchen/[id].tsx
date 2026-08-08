import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { UrgencyBadge } from '../../src/components/UrgencyBadge';
import { useKitchenStore } from '../../src/store/useKitchenStore';
import { formatDate } from '../../src/utils/expiry';
import { foodEmoji } from '../../src/utils/foodEmoji';
import { color, spacing, type } from '../../src/theme/tokens';

const CATEGORY_LABEL: Record<string, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  cupboard: 'Cupboard',
  fruit_veg: 'Fruit & Veg',
};

export default function ItemDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useKitchenStore((s) => s.getById(id));
  const updateItem = useKitchenStore((s) => s.updateItem);
  const markUsed = useKitchenStore((s) => s.markUsed);
  const removeItem = useKitchenStore((s) => s.removeItem);

  if (!item) {
    return (
      <Screen>
        <Text style={styles.notFound}>This item isn't in your kitchen any more.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.emoji}>{foodEmoji(item.name, item.category)}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <UrgencyBadge expiryDate={item.expiryDate} />
      </View>

      {item.needsCheck ? (
        <Card style={styles.checkCard}>
          <Text style={styles.checkTitle}>Check this</Text>
          <Text style={styles.checkBody}>{item.needsCheckReason ?? "Nomeli wasn't fully sure about this one."}</Text>
        </Card>
      ) : null}

      <Card style={styles.detailCard}>
        <DetailRow label="Quantity" value={`${item.quantity} ${item.unit}`} />
        <DetailRow label="Category" value={CATEGORY_LABEL[item.category]} />
        <DetailRow label="Use-by date" value={item.expiryDate ? formatDate(item.expiryDate) : 'None'} />
        <DetailRow label="Date added" value={formatDate(item.dateAdded)} />
        <Pressable style={styles.openedRow} onPress={() => updateItem(item.id, { opened: !item.opened })}>
          <Text style={styles.detailLabel}>Opened</Text>
          <Switch value={item.opened} onValueChange={(v) => updateItem(item.id, { opened: v })} trackColor={{ true: color.sage, false: color.line }} />
        </Pressable>
      </Card>

      <View style={styles.actions}>
        <Button label="Edit" variant="secondary" onPress={() => router.push({ pathname: '/kitchen/add', params: { id: item.id } })} block />
        <Button
          label="Used it"
          variant="secondary"
          onPress={() => {
            markUsed(item.id);
            router.back();
          }}
          block
        />
        <Button
          label="Delete"
          variant="danger"
          onPress={() => {
            removeItem(item.id);
            router.back();
          }}
          block
        />
      </View>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { ...type.body, color: color.inkDim, marginTop: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  emoji: { fontSize: 44 },
  name: { ...type.h1, color: color.ink },
  checkCard: { backgroundColor: color.urgentTomorrowSoft, marginBottom: spacing.lg, gap: 4 },
  checkTitle: { ...type.bodyMedium, color: color.urgentTomorrow },
  checkBody: { ...type.small, color: color.ink },
  detailCard: { gap: spacing.md, marginBottom: spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...type.body, color: color.inkDim },
  detailValue: { ...type.bodyMedium, color: color.ink },
  openedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { gap: spacing.sm, marginBottom: spacing.xl },
});
