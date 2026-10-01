import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { IconName } from '@/components/iconName';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  icon: IconName;
  onPress: () => void;
  variant?: 'solid' | 'outline';
};

/** Pill button used at the bottom of the settings screen. */
export function ActionButton({ label, icon, onPress, variant = 'solid' }: Props) {
  const solid = variant === 'solid';
  const contentColor = solid ? colors.onAccent : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        solid ? styles.solid : styles.outline,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={contentColor} />
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
  },
  solid: {
    backgroundColor: colors.accent,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
});
