import { View, Text, StyleSheet } from 'react-native';
import { Avocado } from './Avocado';
import { color, radius, spacing, type } from '../theme/tokens';

type Props = {
  eyebrow?: string;
  message: string;
};

/** The small "Nomeli noticed…" assistant note — calm, concise, never bossy. */
export function NomeliNote({ eyebrow = 'Nomeli noticed', message }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Avocado size={26} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: color.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  eyebrow: { ...type.caption, color: color.avocadoDark, textTransform: 'uppercase', letterSpacing: 0.4 },
  message: { ...type.body, color: color.ink },
});
