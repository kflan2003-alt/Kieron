import { View, Text, StyleSheet } from 'react-native';
import { Avocado } from './Avocado';
import { Button } from './Button';
import { Card } from './Card';
import { color, spacing, type } from '../theme/tokens';
import { useMealPlanStore } from '../store/useMealPlanStore';

export function ReplanProposalCard() {
  const proposal = useMealPlanStore((s) => s.pendingProposal);
  const accept = useMealPlanStore((s) => s.acceptProposal);
  const dismiss = useMealPlanStore((s) => s.dismissProposal);

  if (!proposal) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avocado size={30} pose="thinking" />
        <Text style={styles.title}>Nomeli has an idea</Text>
      </View>
      <Text style={styles.message}>{proposal.message}</Text>
      <View style={styles.actions}>
        <Button label="Keep current plan" variant="secondary" onPress={dismiss} style={styles.flexButton} />
        <Button label="Update my week" variant="primary" onPress={accept} style={styles.flexButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: color.sage, gap: spacing.md, marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.h2, color: color.avocadoDark },
  message: { ...type.body, color: color.ink },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flexButton: { flex: 1 },
});
