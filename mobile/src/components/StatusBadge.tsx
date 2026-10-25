import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/iconName';
import { colors, radius, spacing, typography } from '@/theme';

export type StatusTone = 'success' | 'warning' | 'neutral' | 'danger';

type Props = {
  tone: StatusTone;
  label: string;
  icon?: IconName;
};

const TONES: Record<StatusTone, { color: string; background: string; defaultIcon: IconName }> = {
  success: {
    color: colors.success,
    background: colors.successSoft,
    defaultIcon: 'checkbox-marked-circle',
  },
  warning: {
    color: colors.warning,
    background: colors.warningSoft,
    defaultIcon: 'alert-circle',
  },
  neutral: {
    color: colors.textSecondary,
    background: colors.surfaceAlt,
    defaultIcon: 'progress-clock',
  },
  danger: {
    color: colors.danger,
    background: colors.dangerSoft,
    defaultIcon: 'bluetooth-off',
  },
};

/** Pill badge under the gauge: status of the current reading/link. */
export function StatusBadge({ tone, label, icon }: Props) {
  const meta = TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: meta.background }]}>
      <MaterialCommunityIcons
        name={icon ?? meta.defaultIcon}
        size={14}
        color={meta.color}
      />
      <Text style={[styles.label, { color: meta.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  label: {
    ...typography.meta,
    fontWeight: '600',
  },
});
