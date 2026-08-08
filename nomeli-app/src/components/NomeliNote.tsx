import { View, Text, StyleSheet } from 'react-native';
import { Avocado } from './Avocado';
import { SpeechBubble } from './SpeechBubble';
import { color, radius, spacing, type } from '../theme/tokens';

type Props = {
  eyebrow?: string;
  message: string;
};

/** The "Nomeli noticed…" assistant note — calm, concise, never bossy. */
export function NomeliNote({ eyebrow = 'Nomeli noticed', message }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Avocado size={30} />
      </View>
      <SpeechBubble>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.message}>{message}</Text>
      </SpeechBubble>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: color.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    flex: 0,
  },
  eyebrow: { ...type.caption, color: color.avocadoDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  message: { ...type.body, color: color.ink, marginTop: 2 },
});
