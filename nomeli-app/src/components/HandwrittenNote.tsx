import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, type } from '../theme/tokens';

type Curve = 'up-left' | 'up-right' | 'down-left' | 'down-right';

const ARROW_PATHS: Record<Curve, { d: string; w: number; h: number }> = {
  'up-left': { d: 'M46 4C30 2 10 10 4 30M4 30l9-6M4 30l3 10', w: 50, h: 40 },
  'up-right': { d: 'M4 4C20 2 40 10 46 30M46 30l-9-6M46 30l-3 10', w: 50, h: 40 },
  'down-left': { d: 'M46 36C30 38 10 30 4 10M4 10l9 6M4 10l3-10', w: 50, h: 40 },
  'down-right': { d: 'M4 36C20 38 40 30 46 10M46 10l-9 6M46 10l-3-10', w: 50, h: 40 },
};

type Props = {
  label: string;
  curve?: Curve;
  color?: string;
  style?: object;
};

/** A small hand-written callout with a sketchy curved arrow — Nomeli's playful commentary, not real UI copy. */
export function HandwrittenNote({ label, curve = 'up-left', color: tint = color.avocadoDark, style }: Props) {
  const arrow = ARROW_PATHS[curve];
  const arrowFirst = curve.startsWith('up');
  return (
    <View style={[styles.row, style]}>
      {arrowFirst && (
        <Svg width={arrow.w * 0.7} height={arrow.h * 0.7} viewBox={`0 0 ${arrow.w} ${arrow.h}`}>
          <Path d={arrow.d} stroke={tint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
        </Svg>
      )}
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {!arrowFirst && (
        <Svg width={arrow.w * 0.7} height={arrow.h * 0.7} viewBox={`0 0 ${arrow.w} ${arrow.h}`}>
          <Path d={arrow.d} stroke={tint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  label: { ...type.hand, fontSize: 19 },
});
