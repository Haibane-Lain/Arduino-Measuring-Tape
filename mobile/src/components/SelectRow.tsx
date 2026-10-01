import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
};

/**
 * Settings row that opens a small option sheet.
 *
 * Deliberately dependency-free: the mockup only needs a list of strings, so a
 * `Modal` beats pulling in a picker library.
 */
export function SelectRow<T extends string>({ label, value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);

  const select = (option: T) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((option) => {
              const active = option === value;
              return (
                <Pressable
                  key={option}
                  style={({ pressed }) => [styles.option, pressed && styles.rowPressed]}
                  onPress={() => select(option)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                  {active ? (
                    <MaterialCommunityIcons name="check" size={18} color={colors.accentBright} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  rowPressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    ...typography.label,
    color: colors.textPrimary,
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  sheet: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sheetTitle: {
    ...typography.meta,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTextActive: {
    color: colors.accentBright,
    fontWeight: '700',
  },
});
