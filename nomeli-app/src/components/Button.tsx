import { ReactNode } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { color, radius, spacing, type } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'text' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  block?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', icon, block, disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        block && styles.block,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, variantTextStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  block: { width: '100%' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  label: { ...type.bodyMedium },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: color.avocadoDark },
  secondary: { backgroundColor: color.sageSoft },
  text: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  danger: { backgroundColor: color.urgentTodaySoft },
};

const variantTextStyles: Record<Variant, { color: string }> = {
  primary: { color: color.white },
  secondary: { color: color.avocadoDark },
  text: { color: color.avocadoDark },
  danger: { color: color.urgentToday },
};
