import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { color, radius, spacing } from '../theme/tokens';

type Props = {
  children: ReactNode;
  tailSide?: 'left' | 'right';
  background?: string;
  style?: object;
};

/** A comic-style speech bubble with a small tail, for Nomeli's messages. */
export function SpeechBubble({ children, tailSide = 'left', background = color.surface, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.bubble, { backgroundColor: background }]}>{children}</View>
      <View
        style={[
          styles.tail,
          tailSide === 'left'
            ? { left: -8, borderRightWidth: 10, borderRightColor: background }
            : { right: -8, borderLeftWidth: 10, borderLeftColor: background },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', flex: 1 },
  bubble: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: color.line,
  },
  tail: {
    position: 'absolute',
    top: 16,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
